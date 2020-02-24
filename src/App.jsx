import React, {useState} from "react";
import Example from "./components/example/Example";

const App = () => {
    const [highlightText, setHighlightText] = useState(false);

    return (
        <div>
            <h1>React Application Works!</h1>
            <Example highlightMessage={highlightText}/>
            <label>
                <input type="checkbox" onChange={e => setHighlightText(e.target.checked)}/>
                &nbsp;Highlight Message
            </label>
        </div>
    )
};

export default App;
