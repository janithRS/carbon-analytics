/**
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

define(['jquery', 'lodash', 'log', 'enjoyhint', 'designViewUtils', 'workspace', 'guideConstants'],
    function ($, _, log, EnjoyHintLib, DesignViewUtils, Workspace, Constants) {

        //enjoyhint instance to be used in the methods of this class
        var instance = null;

        /**
         * Arg: application instance
         */

        var Guide = function (application) {

            var self = this;
            this.app = application;
            this.tabList = this.app.tabController.getTabList();
            var browserStorage = this.app.browserStorage;

            //URLs for AJAX requests
            self.workspaceServiceURL = this.app.config.services.workspace.endpoint;
            var checkFileURL = self.workspaceServiceURL + "/exists/workspace";
            var saveServiceURL = self.workspaceServiceURL + "/write";

            //Dialog box to choose tour options
            self.guideDialog = $('#guideDialog');

            //Script array for the complete guide
            this.completeGuide = [
                {
                    'click #newButton': '<b>Welcome to WSO2 Stream Processor Studio!</b> Click <b class="lime-text">New</b> to get started.',
                    'showNext' : false
                },
                {
                    'next .ace_line': 'First, We have defined an input stream for you!. <b class="lime-text">' +
                        'A stream</b> is a logical series of events ordered in time with a<br> uniquely identifiable ' +
                        'name, and set of defined attributes with specific data types defining its schema. ' +
                        '<br>Click <b class="lime-text">Next</b> to continue.',
                    'margin': 200,
                    'showSkip': false,
                    onBeforeStart: function () {
                        var activeTab = self.app.tabController.getActiveTab();
                        var editor = activeTab.getSiddhiFileEditor().getSourceView().getEditor();
                        var aceEditor = self.app.tabController.getActiveTab().getSiddhiFileEditor().getSourceView().getEditor();
                        editor.session.insert(aceEditor.getCursorPosition(), Constants.INSERT_STRING);
                        Constants.CURRENT_STEP = null;
                    }
                },
                {
                    'click #File': 'To save the file, click <b class="lime-text">File</b>.',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'left': 3,
                    'right': 5,
                    'bottom': 5
                },
                {
                    'click #saveAs': 'Then click <b class="lime-text">Save As</b>.',
                    'showSkip': false,
                    'showNext': false,
                    'left': 3,
                    'right': 3,
                    'bottom': 7,
                    'top': 7
                },
                {
                    'keyCode': Constants.TAB_KEYCODE,
                    'selector': '#saveName',
                    'event': 'key',
                    'description': 'Your file name is this. Press <b class="lime-text">Tab </b>key to continue.',
                    'showNext': false,
                    'showSkip': false,
                    'timeout': 200,
                    onBeforeStart: function () {
                        Constants.FILE_INCREMENT = browserStorage.get('guideFileNameIncrement');
                        Constants.TEMP_FILE = "SweetFactory__" + Constants.FILE_INCREMENT;
                        var fileToBeChecked = "configName=" + btoa(Constants.TEMP_FILE + '.siddhi');

                        $.ajax({
                            url: checkFileURL,
                            type: "POST",
                            contentType: "text/plain; charset=utf-8",
                            data: fileToBeChecked,
                            async: false,
                            success: function (response) {
                                if(response.exists === true){
                                    Constants.TEMP_FILE = Constants.TEMP_FILE.slice(0, 14);
                                    Constants.FILE_INCREMENT++;
                                    Constants.TEMP_FILE = Constants.TEMP_FILE + Constants.FILE_INCREMENT;
                                }
                            },
                            error: function () {
                                DesignViewUtils.prototype.warnAlert("Server error has occurred");
                            }
                        });

                        setTimeout(function () {
                            $('#saveConfigModal').find('#configName').val(Constants.TEMP_FILE).focus();
                        }, 800);
                    }
                },
                {
                    'click #saveButton': 'Click <b class="lime-text">Save</b> to save the file.',
                    'showSkip': false
                },
                {
                    'click .toggle-controls-container': 'Now let us implement the rest of your application from ' +
                        '<b class="lime-text">Design View.<br></b>Click <b class="lime-text">Design View</b> ' +
                        'to open the Design View.',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        Constants.TEMP_FILE = "SweetFactory__" + Constants.FILE_INCREMENT;
                        Constants.FILE_INCREMENT++;
                        browserStorage.put("guideFileNameIncrement", Constants.FILE_INCREMENT);
                    }
                },
                {
                    'next #stream': 'This is a <b class="lime-text">Stream </b>component. you need to use this to ' +
                        'generate the output. Click <b class="lime-text">Next</b>.',
                    'showSkip': false,
                    'showNext': true,
                    onBeforeStart: function () {
                        $('#stream').removeClass('stream-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();

                    }
                },
                {
                    'custom .design-view-container': 'Drag a <b class="lime-text">Stream </b>component and place' +
                        ' it to the right of SweetProduction component.',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 300,
                    onBeforeStart: function () {
                        $('#tool-group-Collections').find('.tool-group-body').css('display', 'none');
                        $('#tool-group-Queries').find('.tool-group-body').css('display', 'none');
                        $('#tool-group-Functions').find('.tool-group-body').css('display', 'none');
                        $("#tool-group-I\\/O").find('.tool-group-body').css('display', 'none');
                        $('#trigger').removeClass('trigger-drag');
                        $('#partition').removeClass('partition-drag');
                        $('#stream').addClass('stream-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();

                        setTimeout(function () {
                            var Interval = null;
                            Interval = window.setInterval(function () {
                                var newElement = self.app.tabController.getActiveTab().getSiddhiFileEditor().getDesignView()
                                    .getConfigurationData().getSiddhiAppConfig();
                                if (newElement.streamList.length === 2) {
                                    instance.trigger('next');
                                    clearInterval(Interval);
                                }
                            }, 3000);
                        }, 3000)
                    }
                },
                {
                    'click .incomplete-element': '<b class="lime-text">Move the cursor over the dropped component</b> and ' +
                        'click<b class="lime-text"> settings </b> icon to open the <b class="lime-text">Stream Configuration</b> form.',
                    'showSkip': false,
                    'showNext': false,
                    'shape': "rect",
                    'margin': 35,
                    onBeforeStart: function () {
                        $('#tool-group-Collections').find('.tool-group-body').css('display', 'block');
                        $('#tool-group-Queries').find('.tool-group-body').css('display', 'block');
                        $('#tool-group-Functions').find('.tool-group-body').css('display', 'block');
                        $("#tool-group-I\\/O").find('.tool-group-body').css('display', 'block');
                        $('.fw-delete').removeClass('fw-delete');
                        $('#trigger').addClass('trigger-drag');
                        $('#partition').addClass('partition-drag');
                    }
                },
                {
                    'keyCode': Constants.TAB_KEYCODE,
                    'selector': '#streamName',
                    'event': 'key',
                    'description': 'We have set the stream name as <b class="lime-text"> TotalProductionStream.</b> ' +
                        'Press<b class="lime-text"> Tab</b> to continue.',
                    'showNext': false,
                    'showSkip': false,
                    onBeforeStart: function () {
                        $('.fw-delete').addClass('fw-delete');
                        $("#streamName").val("TotalProductionStream").focus();
                    }
                },
                {
                    'next .attr-name': 'We have set the attribute name as <b class="lime-text"> ' +
                        'TotalProduction. Click</b><b class="lime-text"> Next</b> to continue',
                    'showSkip': false,
                    'showNext': true,
                    onBeforeStart: function () {
                        $(".attr-name").val("TotalProduction").focus();
                    }
                },
                {
                    'next .attr-type': 'We have set the attribute type as <b class="lime-text"> ' +
                        'long. Click</b><b class="lime-text"> Next</b> to continue.',
                    'showSkip': false,
                    'showNext': true,
                    onBeforeStart: function () {
                        $(".attr-type").val("long");
                    }
                },

                {
                    'click #btn-submit': 'Click <b class="lime-text">Submit</b> to submit the stream configuration.',
                    'showSkip': false,
                    'showNext': false,
                    'scrollAnimationSpeed': 500,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            $('#btn-submit').focus();
                        }, 500);
                    }
                },
                {
                    'next #projection-query': 'This is a <b class="lime-text">Projection component</b> that allows' +
                        ' you to select some or all of the attributes from the input stream to be inserted into the ' +
                        'output stream. Click <b class="lime-text"> Next</b> ',
                    'showSkip': false,
                    'showNext': true,
                    onBeforeStart: function () {
                        $('#projection-query').removeClass('projection-query-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();
                    }
                },
                {
                    'custom .design-view-container': 'Drag a <b class="lime-text">Projection component </b> and place' +
                        ' it between your input and output stream components.',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 300,
                    onBeforeStart: function () {
                        $('#tool-group-Collections').find('.tool-group-body').css('display', 'none');
                        $("div[id='tool-group-Flow Constructs']").find('.tool-group-body').css('display', 'none');
                        $('#tool-group-Functions').find('.tool-group-body').css('display', 'none');
                        $("#tool-group-I\\/O").find('.tool-group-body').css('display', 'none');
                        $('#projection-query').addClass('projection-query-drag');
                        $('#filter-query').removeClass('filter-query-drag');
                        $('#window-query').removeClass('window-query-drag');
                        $('#pattern-query').removeClass('pattern-query-drag');
                        $('#sequence-query').removeClass('sequence-query-drag');
                        $('#join-query').removeClass('join-query-drag');
                        $('#function-query').removeClass('function-query-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();

                        setTimeout(function () {
                            var Interval = null;
                            Interval = window.setInterval(function () {
                                var newElement = self.app.tabController.getActiveTab().getSiddhiFileEditor().getDesignView()
                                    .getConfigurationData().getSiddhiAppConfig();
                                if (newElement.queryLists.WINDOW_FILTER_PROJECTION.length === 1) {
                                    instance.trigger('next');
                                    clearInterval(Interval);
                                }
                            }, 1000);
                        }, 3000)
                    }
                },
                {
                    'custom .design-view-container': 'Connect the input stream to the projection component, ' +
                        'Then connect the Projection component to the output stream using nodes.<br> To do this you can ' +
                        '<b class="lime-text">draw a connecting arrow by dragging the cursor from one node to another</b>',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 300,
                    onBeforeStart: function () {
                        $('#filter-query').addClass('filter-query-drag');
                        $('#window-query').addClass('window-query-drag');
                        $('#pattern-query').addClass('pattern-query-drag');
                        $('#sequence-query').addClass('sequence-query-drag');
                        $("#tool-group-Queries").find('.tool-group-body').css('display', 'none');

                        setTimeout(function () {
                            var Interval = null;
                            var newElement = self.app.tabController.getActiveTab().getSiddhiFileEditor().getDesignView()
                                .getConfigurationData().getSiddhiAppConfig().queryLists.WINDOW_FILTER_PROJECTION[0];

                            Interval = window.setInterval(function () {
                                    if(newElement.queryInput && newElement.queryOutput && newElement.queryInput.from === "SweetProductionStream" &&
                                        newElement.queryOutput.target === "TotalProductionStream") {
                                        clearInterval(Interval);
                                        instance.trigger('next');
                                    }

                            }, 1000);
                        }, 3000);
                    }
                },
                {
                    'click .projectionQueryDrop': 'Move the cursor over the dropped component and click on the ' +
                        '<b class="lime-text">settings</b> icon to open the <b class="lime-text">' +
                        'Query configuration</b> form',
                    'showSkip': false,
                    'showNext': false,
                    'shape': "rect",
                    'margin': 35,
                    onBeforeStart: function () {
                        $('#tool-group-Collections').find('.tool-group-body').css('display', 'block');
                        $("div[id='tool-group-Flow Constructs']").find('.tool-group-body').css('display', 'block');
                        $('#tool-group-Functions').find('.tool-group-body').css('display', 'block');
                        $("#tool-group-I\\/O").find('.tool-group-body').css('display', 'block');
                        $('.fw-delete').removeClass('fw-delete');
                    }
                },
                {
                    'selector': '#form-query-name',
                    'event': 'custom',
                    'description': 'Change the query name to <b class="lime-text">SweetTotalQuery</b>',
                    'showNext': false,
                    'showSkip': false,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            var Interval = null;
                            Interval = window.setInterval(function () {
                                if ($('#form-query-name').find('.form-control').val() === 'SweetTotalQuery') {
                                    instance.trigger('next');
                                    clearInterval(Interval);
                                }
                            }, 1000);
                        }, 4000)
                    }
                },
                {
                    'custom .has-error': 'Enter <b class="lime-text">count()</b> as the expression',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 20,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            var Interval = null;
                            Interval = window.setInterval(function () {
                                if ($('.has-error').find('.form-control').val() === 'count()') {
                                    instance.trigger('next');
                                    clearInterval(Interval);
                                }
                            }, 1000);
                        }, 3000)
                    }
                },
                {
                    'click #btn-submit': 'Click <b class="lime-text">Submit</b> to submit the query configuration',
                    'showSkip': false,
                    'showNext': false,
                    'scrollAnimationSpeed': 500,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            $('#btn-submit').focus();
                        }, 500);
                    }
                },
                {
                    'next #sink': 'This is a <b class="lime-text">Sink component</b>.<br>Sink is a contract that takes ' +
                        'events arriving at a stream, maps them to a predefined data format,<br> and publishes them' +
                        ' to external endpoints. You are using this to <b class="lime-text">display the output result.</b>',
                    'showSkip': false,
                    onBeforeStart: function () {
                        $('#sink').removeClass('sink-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();
                    }
                },
                {
                    'custom .design-view-container': 'Drag a <b class="lime-text">Sink</b> component and place it to ' +
                        'the right of the <b class="lime-text">TotalProduction</b> component',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 300,
                    onBeforeStart: function () {
                        $('#tool-group-Collections').find('.tool-group-body').css('display', 'none');
                        $("div[id='tool-group-Flow Constructs']").find('.tool-group-body').css('display', 'none');
                        $('#tool-group-Functions').find('.tool-group-body').css('display', 'none');
                        $("#tool-group-Queries").find('.tool-group-body').css('display', 'none');
                        $('#source').removeClass('source-drag ');
                        $('#sink').addClass('sink-drag');
                        Constants.CURRENT_STEP = instance.getCurrentStep();

                        setTimeout(function () {
                            var Interval = null;
                            Interval = window.setInterval(function () {
                                var newElement = self.app.tabController.getActiveTab().getSiddhiFileEditor().getDesignView()
                                    .getConfigurationData().getSiddhiAppConfig();
                                if (newElement.sinkList.length === 1) {
                                    instance.trigger('next');
                                    clearInterval(Interval);
                                }
                            }, 1000);
                        }, 3000)
                    }
                },
                {
                    'custom .design-view-container': 'Connect <b class="lime-text">TotalProduction</b> component to it',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'bottom': 300,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            var Interval = null;
                            var newElement = self.app.tabController.getActiveTab().getSiddhiFileEditor().getDesignView()
                                .getConfigurationData().getSiddhiAppConfig().sinkList[0];
                            Interval = window.setInterval(function () {
                                if (newElement.connectedElementName === "TotalProductionStream") {
                                    clearInterval(Interval);
                                    instance.trigger('next');
                                }
                            }, 1000);
                        }, 3000);
                    }
                },
                {
                    'click .sinkDrop': 'Move the mouse over the dropped component and click' +
                        ' <b class="lime-text">settings</b> icon to open the <b class="lime-text">Sink configuration</b>',
                    'showSkip': false,
                    'showNext': false,
                    'shape': "rect",
                    'margin': 35,
                    onBeforeStart: function () {
                        $('.fw-delete').removeClass('fw-delete');
                    }
                },
                {
                    'custom #sink-type': 'Then select <b class="lime-text">Log</b> from the list in the <b class="lime-text">' +
                        'Sink type</b> field',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        var Interval = null;
                        Interval = window.setInterval(function () {
                            if ($('#sink-type').val() === "log") {
                                instance.trigger('next');
                                clearInterval(Interval);
                            }
                        }, 1000)
                    }
                },
                {
                    'click #btn-submit': 'Click <b class="lime-text">Submit</b> to submit the Sink configuration form',
                    'showSkip': false,
                    'showNext': false,
                    'scrollAnimationSpeed': 500,
                    onBeforeStart: function () {
                        setTimeout(function () {
                            $('#btn-submit').focus();
                        }, 500);
                    }
                },
                {
                    'click .toggle-view-button': 'Let us get back to the Source view. Click <b class="lime-text">' +
                        'Source view</b>',
                    'showSkip': false,
                    'showNext': false
                },
                {
                    'click #File': 'To save the file, click <b class="lime-text">File</b>',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'left': 3,
                    'right': 5,
                    'bottom': 7
                },
                {
                    'click #save': 'Then click <b class="lime-text">Save</b>',
                    'showSkip': false,
                    'showNext': false,
                    'left': 3,
                    'right': 3,
                    'bottom': 5,
                    'top': 5
                },
                {
                    'click .event-simulator-activate-btn': 'Now let us run our app using <b class="lime-text">Even Simulator.</b>' +
                        ' To open the Event Simulator, click this icon. ',
                    'showNext': false,
                    'showSkip': false
                },
                {
                    'custom #siddhi-app-name': 'Select the <b class="lime-text">latest' + Constants.TEMP_FILE + '</b> Siddhi application',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        var Interval = null;
                        Interval = window.setInterval(function () {
                            if ($('#siddhi-app-name').val() === Constants.TEMP_FILE) {
                                instance.trigger('next');
                                clearInterval(Interval);
                            }
                        }, 1000)
                    }
                },
                {
                    'custom #stream-name': 'Then select <b class="lime-text">SweetProductionStream</b>',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        var Interval = null;
                        Interval = window.setInterval(function () {
                            if ($('#stream-name').val() === "SweetProductionStream") {
                                instance.trigger('next');
                                clearInterval(Interval);
                            }
                        }, 1000)
                    }
                },
                {
                    'next #attribute-table': 'Enter attribute values as follows.<br>Name :  <b style="color:lime;">Cake</b><br>' +
                        'Amount : <b style="color:lime;">120</b><br>Then click <b class="lime-text">Next.</b>',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click #start-and-send': 'To start the Siddhi application and send the test event,' +
                        'click <b class="lime-text">Start and Send</b>',
                    'showSkip': false,
                    'showNext': false
                },
                {
                    'next #console-container': 'You can see the results logged in this console',
                    'showSkip': false,
                    'showNext': true,
                    'shape': 'rect'
                },
                {
                    'next #attribute-table': 'Simulate another event by entering attribute values as follows' +
                        '<br>Name :  <b class="lime-text">Toffee</b><br>' +
                        'Amount : <b class="lime-text">350</b><br>Then click <b class="lime-text">Next</b>.',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click #start-and-send': 'Click <b class="lime-text">Send</b> to send this event',
                    'showSkip': false,
                    'showNext': false
                },
                {
                    'next #console-container': 'Now the second event is also logged in this console',
                    'showSkip': false,
                    'showNext': true,
                    'shape': 'rect'
                },
                {
                    'click #welcome-page': 'Click here to visit welcome page to view examples',
                    'showNext' : false,
                    'showSkip' : false
                },
                {
                    'click #sampleContent': 'Here are some samples for you to try out!',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click .more-samples': 'Click here to view the full sample list',
                    'showSkip': false,
                    'showFalse': false,
                    'shape': 'rect',
                    'right': 500
                },
                {
                    'next #sampleDialog': 'You can try out more samples from here. click <b class="lime-text">Next</b>',
                    'showSkip': false,
                    'scrollAnimationSpeed': 900,
                    'bottom': 150
                },
                {
                    'click #DataPreprocessing' : '<b class="lime-text">Click</b> here to try a sample which ' +
                        '<b class="lime-text">collect data via TCP transport and preprocess.</b>',
                    'showNext' : false,
                    'showSkip' : false,
                    onBeforeStart: function () {
                        $('#DataPreprocessing').focus();
                    }
                }
            ];

            //Script array for the simulation guide
            this.simulateGuide = [
                {
                    'click .event-simulator-activate-btn': 'Now let us run our app using <b class="lime-text">Even Simulator.</b>' +
                        ' To open the Event Simulator, click this icon.',
                    'showNext': false,
                    'showSkip': false,
                    onBeforeStart: function () {

                        Constants.FILE_INCREMENT = browserStorage.get('guideFileNameIncrement');
                        Constants.TEMP_FILE = "SweetFactory__" + Constants.FILE_INCREMENT;
                        var payload = "configName=" + btoa(Constants.TEMP_FILE + '.siddhi') + "&config=" + (btoa(Constants.CONTENT));
                        var fileToBeChecked = "configName="+btoa(Constants.TEMP_FILE + '.siddhi');

                        $.ajax({
                            url: checkFileURL,
                            type: "POST",
                            contentType: "text/plain; charset=utf-8",
                            data: fileToBeChecked,
                            async: false,
                            success: function (response) {
                                if(response.exists === true){
                                    Constants.TEMP_FILE = Constants.TEMP_FILE.slice(0, 14);
                                    Constants.FILE_INCREMENT++;
                                    Constants.TEMP_FILE = Constants.TEMP_FILE + Constants.FILE_INCREMENT;
                                    payload = "configName=" + btoa(Constants.TEMP_FILE + '.siddhi') + "&config=" + (btoa(content));
                                }
                            }
                        });

                        $.ajax({
                            url: saveServiceURL,
                            type: "POST",
                            data: payload,
                            contentType: "text/plain; charset=utf-8",
                            async: false,
                            success: function (data) {
                                self.app.commandManager.dispatch("open-folder", data.path);
                                self.app.workspaceManager.updateMenuItems();
                                self.app.commandManager.dispatch('remove-unwanted-streams-single-simulation', Constants.TEMP_FILE);
                                log.debug('Simulation file saved successfully');
                            },
                            error: function () {
                                DesignViewUtils.prototype.warnAlert("Server error has occurred");
                            }
                        });
                        Constants.FILE_INCREMENT++;
                        browserStorage.put('guideFileNameIncrement', Constants.FILE_INCREMENT)
                    }
                },
                {
                    'custom #siddhi-app-name': 'We have created a simulation siddhi application for you.' +
                        ' Select the <b class="lime-text">latest ' + Constants.TEMP_FILE + '</b> siddhi application',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        var Interval = null;
                        Interval = window.setInterval(function () {
                            if ($('#siddhi-app-name').val() === Constants.TEMP_FILE) {
                                instance.trigger('next');
                                clearInterval(Interval);
                            }
                        }, 1000)
                    }
                },
                {
                    'custom #stream-name': 'Then select <b class="lime-text">SweetProductionStream</b>',
                    'showSkip': false,
                    'showNext': false,
                    onBeforeStart: function () {
                        var Interval = null;
                        Interval = window.setInterval(function () {
                            if ($('#stream-name').val() === "SweetProductionStream") {
                                instance.trigger('next');
                                clearInterval(Interval);
                            }
                        }, 1000)
                    }
                },
                {
                    'next #attribute-table': 'Enter attribute values as follows.<br>Name :  <b style="color:lime;">Cake</b><br>' +
                        'Amount : <b style="color:lime;">120</b><br>Then click <b class="lime-text">Next.</b>',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click #start-and-send': 'To start the Siddhi application and send the test event,' +
                        'click <b class="lime-text">Start and Send</b>',
                    'showSkip': false,
                    'showNext': false
                },
                {
                    'next #console-container': 'You can see the results logged in this console',
                    'showSkip': false,
                    'showNext': true,
                    'shape': 'rect'
                },
                {
                    'next #attribute-table': 'Simulate another event by entering attribute values as follows' +
                        '<br>Name :  <b class="lime-text">Toffee</b><br>' +
                        'Amount : <b class="lime-text">350</b><br>Then click <b class="lime-text">Next</b>.',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click #start-and-send': 'Click <b class="lime-text">Send</b> to send this event',
                    'showSkip': false,
                    'showNext': false
                },
                {
                    'next #console-container': 'Now the second event is also logged in this console',
                    'showSkip': false,
                    'showNext': true,
                    'shape': 'rect'
                },
                {
                    'click #welcome-page': 'Click here to visit welcome page to view examples',
                    'showSkip': false,
                    'showNext': false,
                    'shape': 'rect',
                    'top': 10
                },
                {
                    'click #sampleContent': 'Here are some samples for you to try out!',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click .more-samples': 'Click here to view the full sample list',
                    'showSkip': false,
                    'showFalse': false,
                    'shape': 'rect',
                    'right': 500
                },
                {
                    'next #sampleDialog' : 'You can try out more samples from here. click <b class="lime-text">Next</b>',
                    'showSkip' : false,
                    'scrollAnimationSpeed' : 900,
                    'bottom' : 150
                },
                {
                    'click #DataPreprocessing' : '<b class="lime-text">Click</b> here to try a sample which ' +
                        '<b class="lime-text">collect data via TCP transport and preprocess.</b>',
                    'showNext' : false,
                    'showSkip' : false,
                    onBeforeStart: function () {
                        $('#DataPreprocessing').focus();
                    }
                }
            ];

            //Script array for the sample guide
            this.sampleGuide = [
                {
                    'click #sampleContent': 'Here are some samples for you to try out!',
                    'showSkip': false,
                    'showNext': true
                },
                {
                    'click .more-samples': 'Click here to view the full sample list',
                    'showSkip': false,
                    'showFalse': false,
                    'shape': 'rect',
                    'right': 500
                },
                {
                    'next #sampleDialog' : 'You can try out more samples from here. click <b class="lime-text">Next</b>',
                    'showSkip' : false,
                    'scrollAnimationSpeed' : 900,
                    'bottom' : 150
                },
                {
                    'click #DataPreprocessing' : '<b class="lime-text">Click</b> here to try a sample which ' +
                        '<b class="lime-text">collect data via TCP transport and preprocess.</b>',
                    'showNext' : false,
                    'showSkip' : false,
                    onBeforeStart: function () {
                        $('#DataPreprocessing').focus();
                    }
                }
            ];
        };

        //Constructor for the guide
        Guide.prototype.constructor = Guide;

        //function to view the dialog box to choose the guide option
        Guide.prototype.showModel =  function(){
            this.guideDialog.modal('show').on('shown.bs.modal', function(){
                $('#guideDialog').trigger('loaded');
            });
            this.guideDialog.on('hidden.bs.modal', function(){
                $('#guideDialog').trigger('unloaded');
            })
        };

        //start function for the complete guide
        Guide.prototype.start = function () {

            var self = this;
            var guideModal = self.guideDialog.filter("#guideDialog");
            var hintInstance = new EnjoyHint({});
            var callback = function() { guideModal.modal('hide') };

            //check whether there are multiple tabs and if the current tab is "welcome-page"
            _.each(self.tabList, function (tab) {
                if (self.tabList.length === 1 && tab._title === "welcome-page") {
                    self.showModel();
                } else {
                    DesignViewUtils.prototype.errorAlert(Constants.ERROR_TEXT);
                }
            });

            //function for the complete tour
            guideModal.find("button").filter("#fullGuide").click(function() {

                //unbinding the click events from the previous click
                $('#fullGuide').off('click');
                $('#simulationGuide').off('click');
                $('#sampleGuide').off('click');

                hintInstance.setScript(self.completeGuide);
                hintInstance.runScript();

                instance = hintInstance;
                callback();
            });

            //function for the simulation tour
            guideModal.find("button").filter("#simulationGuide").click(function() {

                //unbinding the click events from the previous click
                $('#fullGuide').off('click');
                $('#simulationGuide').off('click');
                $('#sampleGuide').off('click');

                hintInstance.setScript(self.simulateGuide);
                hintInstance.runScript();

                instance = hintInstance;
                callback();
            });

            //function for the sample tour
            guideModal.find("button").filter("#sampleGuide").click(function() {

                //unbinding the click events from the previous click
                $('#fullGuide').off('click');
                $('#simulationGuide').off('click');
                $('#sampleGuide').off('click');

                hintInstance.setScript(self.sampleGuide);
                hintInstance.runScript();

                instance = hintInstance;
                callback();
            });

            $('.enjoyhint_close_btn').click(function () {
                switch (Constants.CURRENT_STEP) {
                    case 7  :   $('#stream').addClass('stream-drag');
                                break;
                    case 8  :   $('#trigger').addClass('trigger-drag');
                                $('#partition').addClass('partition-drag');
                                break;
                    case 14 :   $('#projection-query').addClass('projection-query-drag');
                                break;
                    case 15 :   $('#filter-query').addClass('filter-query-drag');
                                $('#window-query').addClass('window-query-drag');
                                $('#pattern-query').addClass('pattern-query-drag');
                                $('#sequence-query').addClass('sequence-query-drag');
                                break;
                    case 21 :   $('#sink').addClass('sink-drag');
                                break;
                    case 22 :   $('#source').addClass('source-drag ');
                                break;

                }
            })
        };

        return Guide;
    });