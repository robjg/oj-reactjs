
import { OjMain } from './main/ojMain';

import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';

function foo(nodeId: number) {
    return function() {
        alert(`Yow ${nodeId}!`);
    }
}

var main = new OjMain({ contextMenuProvider: foo});

main.start();
