//
//  REAJsiUtilities.cpp
//  RNReanimated
//
//  Created by Christian Falch on 25/04/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#include "YeetJSIUtils.h"
#import <React/RCTConvert.h>
#import <React/RCTBridgeModule.h>
//#import <ReactCommon/TurboModuleUtils.h>

/**
 * All helper functions are ObjC++ specific.
 */
jsi::Value convertINSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value)
{
    return jsi::Value((bool)[value boolValue]);
}

jsi::Value convertINSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value)
{
    return jsi::Value([value doubleValue]);
}

jsi::String convertINSStringToJSIString(jsi::Runtime &runtime, NSString *value)
{
    return jsi::String::createFromUtf8(runtime, [value UTF8String] ?: "");
}

jsi::Value convertIObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
jsi::Object convertINSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value)
{
    jsi::Object result = jsi::Object(runtime);
    for (NSString *k in value) {
        result.setProperty(runtime, [k UTF8String], convertIObjCObjectToJSIValue(runtime, value[k]));
    }
    return result;
}

jsi::Array convertINSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value)
{
    jsi::Array result = jsi::Array(runtime, value.count);
    for (size_t i = 0; i < value.count; i++) {
        result.setValueAtIndex(runtime, i, convertIObjCObjectToJSIValue(runtime, value[i]));
    }
    return result;
}

std::vector<jsi::Value> convertINSArrayToStdVector(jsi::Runtime &runtime, NSArray *value)
{
    std::vector<jsi::Value> result;
    for (size_t i = 0; i < value.count; i++) {
        result.emplace_back(convertIObjCObjectToJSIValue(runtime, value[i]));
    }
    return result;
}

jsi::Value convertIObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
    if ([value isKindOfClass:[NSString class]]) {
        return convertINSStringToJSIString(runtime, (NSString *)value);
    } else if ([value isKindOfClass:[NSNumber class]]) {
        if ([value isKindOfClass:[@YES class]]) {
            return convertINSNumberToJSIBoolean(runtime, (NSNumber *)value);
        }
        return convertINSNumberToJSINumber(runtime, (NSNumber *)value);
    } else if ([value isKindOfClass:[NSDictionary class]]) {
        return convertINSDictionaryToJSIObject(runtime, (NSDictionary *)value);
    } else if ([value isKindOfClass:[NSArray class]]) {
        return convertINSArrayToJSIArray(runtime, (NSArray *)value);
    } else if (value == (id)kCFNull) {
        return jsi::Value::null();
    }
    return jsi::Value::undefined();
}

id convertIJSIValueToObjCObject(
                               jsi::Runtime &runtime,
                               const jsi::Value &value);
NSString *convertIJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
    return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

NSArray *convertIJSIArrayToNSArray(
                                  jsi::Runtime &runtime,
                                  const jsi::Array &value)
{
    size_t size = value.size(runtime);
    NSMutableArray *result = [NSMutableArray new];
    for (size_t i = 0; i < size; i++) {
        // Insert kCFNull when it's `undefined` value to preserve the indices.
        [result
         addObject:convertIJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i)) ?: (id)kCFNull];
    }
    return [result copy];
}

NSDictionary *convertIJSIObjectToNSDictionary(
                                             jsi::Runtime &runtime,
                                             const jsi::Object &value)
{
    jsi::Array propertyNames = value.getPropertyNames(runtime);
    size_t size = propertyNames.size(runtime);
    NSMutableDictionary *result = [NSMutableDictionary new];
    for (size_t i = 0; i < size; i++) {
        jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
        NSString *k = convertIJSIStringToNSString(runtime, name);
        id v = convertIJSIValueToObjCObject(runtime, value.getProperty(runtime, name));
        if (v) {
            result[k] = v;
        }
    }
    return [result copy];
}

RCTResponseSenderBlock convertIJSIFunctionToCallback(
                                                    jsi::Runtime &runtime,
                                                    const jsi::Function &value)
{
    __block auto cb = value.getFunction(runtime);

    return ^(NSArray *responses) {
        cb.call(runtime, convertINSArrayToJSIArray(runtime, responses), 1);
    };
}

id convertIJSIValueToObjCObject(
                               jsi::Runtime &runtime,
                               const jsi::Value &value)
{
    if (value.isUndefined() || value.isNull()) {
        return nil;
    }
    if (value.isBool()) {
        return @(value.getBool());
    }
    if (value.isNumber()) {
        return @(value.getNumber());
    }
    if (value.isString()) {
        return convertIJSIStringToNSString(runtime, value.getString(runtime));
    }
    if (value.isObject()) {
        jsi::Object o = value.getObject(runtime);
        if (o.isArray(runtime)) {
            return convertIJSIArrayToNSArray(runtime, o.getArray(runtime));
        }
        if (o.isFunction(runtime)) {
            return convertIJSIFunctionToCallback(runtime, std::move(o.getFunction(runtime)));
        }
        return convertIJSIObjectToNSDictionary(runtime, o);
    }

    throw std::runtime_error("Unsupported jsi::jsi::Value kind");
}

Promise::Promise(jsi::Runtime &rt, jsi::Function resolve, jsi::Function reject)
: runtime_(rt), resolve_(std::move(resolve)), reject_(std::move(reject)) {}

void Promise::resolve(const jsi::Value &result) {
    resolve_.call(runtime_, result);
}

void Promise::reject(const std::string &message) {
    jsi::Object error(runtime_);
    error.setProperty(
                      runtime_, "message", jsi::String::createFromUtf8(runtime_, message));
    reject_.call(runtime_, error);
}

jsi::Value createPromiseAsJSIValue(
                                   jsi::Runtime &rt,
                                   const PromiseSetupFunctionType func) {
    jsi::Function JSPromise = rt.global().getPropertyAsFunction(rt, "Promise");
    jsi::Function fn = jsi::Function::createFromHostFunction(
                                                             rt,
                                                             jsi::PropNameID::forAscii(rt, "fn"),
                                                             2,
                                                             [func](
                                                                    jsi::Runtime &rt2,
                                                                    const jsi::Value &thisVal,
                                                                    const jsi::Value *args,
                                                                    size_t count) {
        jsi::Function resolve = args[0].getObject(rt2).getFunction(rt2);
        jsi::Function reject = args[1].getObject(rt2).getFunction(rt2);
        auto wrapper = std::make_shared<Promise>(
                                                 rt2, std::move(resolve), std::move(reject));
        func(rt2, wrapper);
        return jsi::Value::undefined();
    });

    return JSPromise.callAsConstructor(rt, fn);
}
