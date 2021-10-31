//
//  SqlIteModule.cpp
//  SqliteStorage
//
//  Created by Sergei Golishnikov on 31/10/2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#include "SqlIteModule.h"

#import <React/RCTUtils.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>
#import <sys/utsname.h>
#import "YeetJSIUtils.h"

using namespace facebook;
using namespace std;

@implementation SqlIteModule

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;
@synthesize sqlite = _sqlite;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)setBridge:(RCTBridge *)bridge {
    _bridge = bridge;
    _setBridgeOnMainQueue = RCTIsMainQueue();
    _sqlite = [[SQLite alloc] init];
    [self installLibrary];
}

- (void)installLibrary {

    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
        
        if (!cxxBridge.runtime) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.001 * NSEC_PER_SEC),
                           dispatch_get_main_queue(), ^{
                [self installLibrary];
                
            });
            return;
        }

        install(*(facebook::jsi::Runtime *)cxxBridge.runtime, self);
}

static void install(jsi::Runtime &jsiRuntime, SqlIteModule *sqliteModule) {
    
    // open
    auto open = jsi::Function::createFromHostFunction(jsiRuntime,
                                                         jsi::PropNameID::forAscii(jsiRuntime,"open"),
                                                         3,
    [sqliteModule](jsi::Runtime &runtime,
                const jsi::Value &thisValue,
                const jsi::Value *arguments,
                size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        [[sqliteModule sqlite] open:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "open", move(open));
    
    
    
    // close
    auto close = jsi::Function::createFromHostFunction(jsiRuntime,
                                                         jsi::PropNameID::forAscii(jsiRuntime,"close"),
                                                         3,
    [sqliteModule](jsi::Runtime &runtime,
                const jsi::Value &thisValue,
                const jsi::Value *arguments,
                size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] close:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "close", move(close));
    
    
    
    // attach
    auto attach = jsi::Function::createFromHostFunction(jsiRuntime,
                                                         jsi::PropNameID::forAscii(jsiRuntime,"attach"),
                                                         3,
    [sqliteModule](jsi::Runtime &runtime,
                const jsi::Value &thisValue,
                const jsi::Value *arguments,
                size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] attach:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "attach", move(attach));
    
    
    
    // delete
    auto d = jsi::Function::createFromHostFunction(jsiRuntime,
                                                         jsi::PropNameID::forAscii(jsiRuntime,"delete"),
                                                         3,
    [sqliteModule](jsi::Runtime &runtime,
                const jsi::Value &thisValue,
                const jsi::Value *arguments,
                size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] sqliteDelete:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "delete", move(d));
    
    
    
    // backgroundExecuteSqlBatch
    auto backgroundExecuteSqlBatch = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                           jsi::PropNameID::forAscii(jsiRuntime,"backgroundExecuteSqlBatch"),
                                                                           3,
                                                                           [sqliteModule](jsi::Runtime &runtime,
                                                                                          const jsi::Value &thisValue,
                                                                                          const jsi::Value *arguments,
                                                                                          size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] backgroundExecuteSqlBatch:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "backgroundExecuteSqlBatch", move(backgroundExecuteSqlBatch));
    
    
    
    // executeSqlBatch
    auto executeSqlBatch = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                 jsi::PropNameID::forAscii(jsiRuntime,"executeSqlBatch"),
                                                                 3,
                                                                 [sqliteModule](jsi::Runtime &runtime,
                                                                                const jsi::Value &thisValue,
                                                                                const jsi::Value *arguments,
                                                                                size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] executeSqlBatch:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "executeSqlBatch", move(executeSqlBatch));
    
    
    
    
    // executeSqlBatch
    auto backgroundExecuteSql = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                      jsi::PropNameID::forAscii(jsiRuntime,"backgroundExecuteSql"),
                                                                      3,
                                                                      [sqliteModule](jsi::Runtime &runtime,
                                                                                     const jsi::Value &thisValue,
                                                                                     const jsi::Value *arguments,
                                                                                     size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] backgroundExecuteSql:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "backgroundExecuteSql", move(backgroundExecuteSql));
    
    
    
    
    // executeSqlBatch
    auto executeSql = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                      jsi::PropNameID::forAscii(jsiRuntime,"executeSql"),
                                                                      3,
                                                                      [sqliteModule](jsi::Runtime &runtime,
                                                                                     const jsi::Value &thisValue,
                                                                                     const jsi::Value *arguments,
                                                                                     size_t count) -> jsi::Value {
        
        arguments[0].getObject(runtime);
        auto *dict = convertIJSIObjectToNSDictionary(runtime, arguments[0].getObject(runtime));
        
        __block auto success = arguments[1].getObject(runtime).getFunction(runtime);
        __block auto error = arguments[2].getObject(runtime).getFunction(runtime);
        
        [[sqliteModule sqlite] executeSql:dict success:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            success.call(runtime, v, 1);
        } error:^(id message) {
            jsi::Value v = convertIObjCObjectToJSIValue(runtime, message);
            error.call(runtime, v, 1);
        }];
        return jsi::Value(0);
    });
    
    jsiRuntime.global().setProperty(jsiRuntime, "executeSql", move(executeSql));
}
@end
