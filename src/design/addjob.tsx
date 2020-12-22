import React from 'react';

type AddjobProps = {

    options: string[]; 

    hideForm: () => void;    

    launchDesignForm: (tag: string) =>  void;
}

type AddjobState = {

    selected: string | undefined;
}

export class AddJobForm extends React.Component<AddjobProps, AddjobState> {

    constructor(props: AddjobProps) {
        super(props);

        this.state = {

            selected: props.options[0]
        }

        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        if (this.state.selected) {
            this.props.launchDesignForm(this.state.selected);
        }
    }

    handleChange(event: React.FormEvent<HTMLSelectElement>): void {
        this.setState({
            selected: event.currentTarget.value
        });
    }

    render() {
        return <div className="oj-add-form-main">
            <form data-testid="add-form" onReset={this.props.hideForm} onSubmit={this.onSubmit}>
                <select value={this.state.selected} onChange={this.handleChange}>
                    {
                        this.props.options.map(e => <option key={e} value={e}>{e}</option>)
                    }
                </select>
                <button type="submit">OK</button>
                <button type="reset">Cancel</button>
            </form>
        </div>
    }

}
