import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation} from "@angular/core";
import {CommandInputParameterModel, CommandOutputParameterModel, ExpressionModel} from "cwlts/models";
import {DirectiveBase} from "../../../util/directive-base/directive-base";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {Subscription} from "rxjs/Subscription";

@Component({
    encapsulation: ViewEncapsulation.None,

    selector: "ct-secondary-file",
    template: `
        <ct-form-panel class="borderless" [collapsed]="true">
            <div class="tc-header">Secondary Files</div>
            <div class="tc-body">
                <form [formGroup]="form">
                    <ct-blank-tool-state *ngIf="!readonly && !secondaryFiles.length"
                                         [buttonText]="'Add secondary file'"
                                         (buttonClick)="addFile()">
                        No Secondary Files defined.
                    </ct-blank-tool-state>

                    <div *ngIf="readonly && !secondaryFiles.length" class="text-xs-center h5">
                        No Secondary Files defined.
                    </div>

                    <ol *ngIf="secondaryFiles.length > 0" class="list-unstyled">

                        <li *ngFor="let control of form.get('list').controls; let i = index"
                            class="removable-form-control">

                            <ct-expression-input
                                    [context]="context"
                                    [formControl]="control"
                                    [readonly]="readonly">
                            </ct-expression-input>

                            <div *ngIf="!readonly" class="remove-icon clickable ml-1 text-hover-danger"
                                 [ct-tooltip]="'Delete'"
                                 (click)="removeFile(i)">
                                <i class="fa fa-trash"></i>
                            </div>
                        </li>
                    </ol>

                    <button type="button" *ngIf="secondaryFiles.length > 0 && !readonly"
                            class="btn btn-link add-btn-link no-underline-hover"
                            (click)="addFile()">
                        <i class="fa fa-plus"></i> Add secondary file
                    </button>
                </form>

            </div>
        </ct-form-panel>
    `
})

export class SecondaryFilesComponent extends DirectiveBase implements OnChanges, OnInit {

    @Input()
    public readonly = false;

    /** Context in which expression should be evaluated */
    @Input()
    public context: { $job: any } = {$job: {}};

    @Input()
    port: CommandInputParameterModel | CommandOutputParameterModel;

    @Input()
    bindingName: string;

    secondaryFiles: ExpressionModel[] = [];

    @Output()
    update = new EventEmitter<ExpressionModel[]>();

    form = new FormGroup({list: new FormArray([])});

    private subscription: Subscription;

    removeFile(i) {
        this.secondaryFiles[i].setValue("", "string");
        (this.form.get("list") as FormArray).removeAt(i);
    }

    addFile() {
        const cmd = this.port.addSecondaryFile(null);
        (this.form.get("list") as FormArray).push(new FormControl(cmd));
    }

    ngOnInit() {
        if (this.port) {
            this.updateFormArray();
        }
    }

    ngOnChanges() {
        if (this.port) {
            this.updateFormArray();
        }
    }

    private updateFileList() {
        this.secondaryFiles = this.port.secondaryFiles;
        // if (this.port.hasSecondaryFiles) {
        //     this.secondaryFiles = this.port.secondaryFiles;
        // } else if (this.port[this.bindingName] && this.port[this.bindingName].hasSecondaryFiles) {
        //     this.secondaryFiles = this.port[this.bindingName].secondaryFiles;
        // }
    }

    private updateFormArray() {
        // cancel previous subscription so recreation of form doesn't trigger an update
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        this.updateFileList();

        const formList = [];

        // create formControls from each baseCommand
        for (let i = 0; i < this.secondaryFiles.length; i++) {
            formList.push(new FormControl(this.secondaryFiles[i]));
        }

        this.form.setControl("list", new FormArray(formList));

        // re-subscribe update output to form changes
        this.subscription = this.form.valueChanges.map(form => (form.list)).subscribe((list) => {
            if (list) {
                debugger;
                this.port.updateSecondaryFiles(list);
                this.updateFileList();
                this.secondaryFiles.forEach(file => file.validate(this.context));
                this.update.emit(list);
            }
        });
    }
}
