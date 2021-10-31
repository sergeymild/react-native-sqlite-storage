//
//  SqlIteModule.hpp
//  SqliteStorage
//
//  Created by Sergei Golishnikov on 31/10/2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "SQLite.h"

@interface SqlIteModule : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;
@property (strong) SQLite *sqlite;
@end
