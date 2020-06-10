import { DialogData } from "./ojDao";

// The div id that the form will attach to.
const DEFAULT_ACTION_FORM_DIVID = 'ojForm';


export interface Form {

    doForm: (form: DialogData, submit: (form$: JQuery) => void ) => void;
}

/**
 * Create a popup form for submitting the parameters for executing an Oddjob action.
 *
 * @param divId
 * @returns {{doForm: doForm}}
 */
export class OjForm implements Form {

    constructor(private divId: string = DEFAULT_ACTION_FORM_DIVID) {
    }

    doForm = (form: DialogData, submit: (form$: JQuery) => void ) => {

        let formDiv$: JQuery = $('#' + this.divId);

        let form$: JQuery = $('<form class="actionForm">').appendTo(formDiv$);

        for (var i = 0; i < form.fields.length; ++i) {

            var field = form.fields[i];
            var field$ = $('<p>').appendTo(form$);
            var fieldId = this.divId + 'Field' + i;
            if (field.label != undefined) {
                $('<label>').appendTo(field$).attr('for', fieldId).text(field.label);
            }
            if (field.name != undefined) {
                var input$ = $('<input>').appendTo(field$);
                input$.attr('name', field.name);

                if (field.fieldType === 'PASSWORD') {
                    input$.attr('type', 'password');
                }
                else if (field.fieldType === 'FILE') {
                    input$.attr('type', 'file');
                }
                else {
                    input$.attr('type', 'text');
                }

                input$.attr('id', fieldId);
            }
        }

        var cancel = function () {
            formDiv$.css('display', 'none');
            formDiv$.empty();
        };

        var buttons$ = $('<p>').appendTo(form$);
        buttons$.append('<input type="submit" value="OK"/>');

        $('<input type="button" value="Cancel"/>').appendTo(buttons$).click(function () {
            cancel();
        });

        form$.submit(function (event) {
            submit(form$);
            event.preventDefault();
            cancel();
        });

        formDiv$.css('display', 'block');
    }
}