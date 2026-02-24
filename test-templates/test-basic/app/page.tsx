import { definePage } from "flowjs";

export default definePage({
    meta() {
        return { title: "Home | FlowJS" };
    },
    default() {
        return (
            <div>
                <h1>Welcome to FlowJS</h1>
                <p>This is the home page. Try navigating around!</p>
            </div>
        );
    }
});
