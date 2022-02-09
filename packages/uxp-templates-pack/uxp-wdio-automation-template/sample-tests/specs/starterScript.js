
/*
 *  Copyright 2021 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

describe("My UXP Plugin", () => {

    it("Starter Script", async() => {
        const result = browser.execute((a, b, c, d) => {
            // UXP API to be exposed by Host Apps will be called here
            return a + b + c + d;
        }, 1, 2, 3, 4);
        await browser.pause(2000);
        console.log(result);
    });

});


