// If you want to use React instead of vanilla modules, use the reactBootstrapper,
// the same rules and guidelines apply for this bootstrapper as they do for the bootstrapper and asyncBootstrapper (split your code responsibly).
// The reactBootstrapper supports both static and dynamic imports - which is why there is no asyncReactBootstrapper
import { reactBootstrapper } from "./utils/react/reactBootstrapper";
import App from "./App";
reactBootstrapper({
    App
});

// You can use the following code to listen for when the styles on the page are lazy-loaded. This is cool for waiting for
// styles to be rendered and ready (if you need them for calculating sizes and similar), but since everything is loaded
// asynchronously, you can't know the load order, so the CSS might be loaded before the JS is. Your code MUST assume that
// the CSS has *already* been loaded once the JS runs.
// This function is especially helpful for slow browsers (IE) and slow/unstable connections.
//
// window.akqa = window.akqa || {};
// window.akqa.stylesRendered = () => {
//     // Run your repaint callbacks here. Consider using a throttle/debounce, and
//     // remember to run the function at load-time if the code here is important
//     // for your layout (pro-tip: it probably shouldn't be).
// };
