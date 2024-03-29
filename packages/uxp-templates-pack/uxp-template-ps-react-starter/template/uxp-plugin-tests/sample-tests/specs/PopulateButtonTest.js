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

const HomePage = require('../page-objects/homepage.js');
describe('Click on Populate Layers Button', () => {
    it('should click on Populate layers Button', async () => {
        await HomePage.clickOnPopulateLayerButton();
        // Add your validation here
        const result = await browser.execute(() => {
            const app = window.require("photoshop").app;
           	const length = app.activeDocument.layers ? app.activeDocument.layers.length : 0 ;
            return length
       });
   	    const result1 = await browser.execute(() => {
	   	    return	document.getElementsByTagName("li").length;
   	    });
   	    expect(result).toStrictEqual(result1);
    });
});