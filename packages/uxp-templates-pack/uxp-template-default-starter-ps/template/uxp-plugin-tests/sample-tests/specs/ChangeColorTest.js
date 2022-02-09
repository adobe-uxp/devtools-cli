
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

describe('Click on Change Color Button', () => {
    it('should click on Change Color Button', async () => {
        await HomePage.click();
        const color = await browser.execute(() => {
        	const bodyColor = document.body.style.color;
        	return bodyColor;
        });
		expect(color).toStrictEqual("red");
	    });
});


