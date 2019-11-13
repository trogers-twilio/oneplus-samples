# Sample code for OnePlus and Tin Tin

## Example Studio Flows
### [Messaging with Lookup and Language](studio-flows/messaging-with-lookup-and-language.json)
#### Overview
This Studio Flow provides an example of how to perform a Lookup with the customer's number using the Lookup API. This is used to retrieve the Country Code.

The Country Code is then passed into a function to get the language code. The language code is then passed into a function to dynamically retrieve the greeting message, avoiding a lot of extra management in Studio itself.

#### Function Dependencies
This flow is dependent on the function in the `functions` folder of this repository. Please ensure they are deployed before deploying the Studio Flow. Information on Twilio Functions can be found here:

https://www.twilio.com/docs/runtime/functions

#### Deploying Studio Flow
The Studio Flow JSON can be imported into a new Studio Flow in your own Twilio project. Instructions for importing a Studio Flow JSON file can be found here:

https://www.twilio.com/docs/studio/user-guide#importing-flow-data

#### Cleaning up Function References
After importing the Studio Flow, it may be necessary to edit the Function widgets to point to your own versions of the functions. If so, open the newly imported Studio Flow and go through each widget starting with the word `Function` and select the correct function from the dropdown list.

## Example Flex Plugins
### [Chat Auto Accept](https://github.com/trogers-twilio/oneplus-samples/tree/master/flex-plugins/plugin-chat-auto-accept)
#### Overview
This sample plugin shows you how to auto accept a chat based task
 
