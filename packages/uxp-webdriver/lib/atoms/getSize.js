/*
 *  Copyright 2020 Adobe Systems Incorporated. All rights reserved.
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

var GET_SIZE = "function(){return function(){function d(a,b){function c(){}c.prototype=b.prototype;a.b=b.prototype;a.prototype=new c};function e(a){this.stack=Error().stack||\"\";if(a)this.message=String(a)}d(e,Error);function f(a){for(var b=1;b<arguments.length;b++)var c=String(arguments[b]).replace(/\\$/g,\"$$$$\"),a=a.replace(/\\%s/,c);return a};d(function(a,b){b.unshift(a);e.call(this,f.apply(null,b));b.shift();this.a=a},e);function g(a,b){this.width=a;this.height=b}g.prototype.toString=function(){return\"(\"+this.width+\" x \"+this.height+\")\"};function h(a){var b=a.offsetWidth,c=a.offsetHeight;if((b===void 0||!b&&!c)&&a.getBoundingClientRect)return a=a.getBoundingClientRect(),new g(a.right-a.left,a.bottom-a.top);return new g(b,c)};function i(a){var b;a:{b=a.nodeType==9?a:a.ownerDocument||a.document;if(b.defaultView&&b.defaultView.getComputedStyle&&(b=b.defaultView.getComputedStyle(a,null))){b=b.display||b.getPropertyValue(\"display\");break a}b=\"\"}if((b||(a.currentStyle?a.currentStyle.display:null)||a.style&&a.style.display)!=\"none\")return h(a);b=a.style;var c=b.display,m=b.visibility,n=b.position;b.visibility=\"hidden\";b.position=\"absolute\";b.display=\"inline\";a=h(a);b.display=c;b.position=n;b.visibility=m;return a}\nvar j=\"_\".split(\".\"),k=this;!(j[0]in k)&&k.execScript&&k.execScript(\"var \"+j[0]);for(var l;j.length&&(l=j.shift());)!j.length&&i!==void 0?k[l]=i:k=k[l]?k[l]:k[l]={};; return this._.apply(null,arguments);}.apply({navigator:typeof window!='undefined'?window.navigator:null}, arguments);}";
module.exports = GET_SIZE;
