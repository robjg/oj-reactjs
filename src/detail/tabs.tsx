import React from 'react';

export class Tabs extends React.Component<{}, {}> {

    render() {
        return         (
        <div id="oj-detail-tabs" className="tabbed-pane">
            <div className="tabs global-font">
                <ul>
                    <li className="state selected"><a href="#">State</a></li>
                    <li className="console notSelected"><a href="#">Console</a></li>
                    <li className="log notSelected"><a href="#">Log</a></li>
                    <li className="properties notSelected"><a href="#">Properties</a></li>
                </ul>
            </div>
            <div className="tab-content">
                <div className="state selected">
                    <table className="state-content global-font">
                        <colgroup>
                            <col className="title-col"/>
                            <col className="value-col"/>
                        </colgroup>
                        <tbody>
                        <tr>
                            <td>State</td>
                            <td className="state-state-cell">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Time</td>
                            <td className="state-time-cell">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Exception</td>
                            <td ><pre className="state-exception-cell"></pre></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="console notSelected">
                    <pre className="console-content text-area">
                    </pre>
                </div>

                <div className="log notSelected">
                    <pre className="log-content text-area">
                    </pre>
                </div>

                <div className="properties notSelected">
                    <table className="global-font">
                        <colgroup>
                            <col className="title-col"/>
                            <col className="value-col"/>
                        </colgroup>
                        <tbody className="properties-content">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
    }
}
