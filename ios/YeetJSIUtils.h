//
//  YeetJSIUTils.h
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <jsi/jsi.h>
#import <React/RCTBridgeModule.h>

using namespace facebook;
/**
 * All static helper functions are ObjC++ specific.
 */
jsi::Value convertINSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value);
jsi::Value convertINSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value);
jsi::String convertINSStringToJSIString(jsi::Runtime &runtime, NSString *value);
jsi::Value convertIObjCObjectToJSIValue(jsi::Runtime &runtime, id value);;
jsi::Object convertINSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value);
jsi::Array convertINSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value);
std::vector<jsi::Value> convertINSArrayToStdVector(jsi::Runtime &runtime, NSArray *value);
jsi::Value convertIObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
id convertIJSIValueToObjCObject(
                               jsi::Runtime &runtime,
                               const jsi::Value &value);
NSString* convertIJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value);
NSArray* convertIJSIArrayToNSArray(
                                  jsi::Runtime &runtime,
                                  const jsi::Array &value);
NSDictionary *convertIJSIObjectToNSDictionary(
                                             jsi::Runtime &runtime,
                                             const jsi::Object &value);
RCTResponseSenderBlock convertIJSIFunctionToCallback(
                                                    jsi::Runtime &runtime,
                                                    const jsi::Function &value);
id convertIJSIValueToObjCObject(
                               jsi::Runtime &runtime,
                               const jsi::Value &value);
RCTResponseSenderBlock convertIJSIFunctionToCallback(
                                                    jsi::Runtime &runtime,
                                                    const jsi::Function &value);

struct Promise {
    Promise(jsi::Runtime &rt, jsi::Function resolve, jsi::Function reject);

    void resolve(const jsi::Value &result);
    void reject(const std::string &error);

    jsi::Runtime &runtime_;
    jsi::Function resolve_;
    jsi::Function reject_;
};

using PromiseSetupFunctionType =
std::function<void(jsi::Runtime &rt, std::shared_ptr<Promise>)>;
jsi::Value createPromiseAsJSIValue(
                                   jsi::Runtime &rt,
                                   const PromiseSetupFunctionType func);
