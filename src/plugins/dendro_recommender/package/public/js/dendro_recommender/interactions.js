var Interactions = {

    types:
    {
        accept_descriptor_from_quick_list : {
            key: "accept_descriptor_from_quick_list",
            label : "Accepted from suggestion list"
        },
        accept_descriptor_from_manual_list : {
            key: "accept_descriptor_from_manual_list",
            label : "Accepted from manual list"
        },
        accept_smart_descriptor_in_metadata_editor : {
            key : "accept_smart_descriptor_in_metadata_editor",
            label : "Accepted smart descriptor in metadata editor"
        },
        accept_favorite_descriptor_in_metadata_editor : {
            key : "accept_favorite_descriptor_in_metadata_editor",
            label : "Accept favorite in metadata editor"
        },
        accept_descriptor_from_autocomplete : {
            key : "accept_descriptor_from_autocomplete",
            label : "Accept descriptor from auto-complete"
        },
        hide_descriptor_from_quick_list_for_project : {
            key : "hide_descriptor_from_quick_list_for_project",
            label : "Hide descriptor from quick list for project"
        },
        unhide_descriptor_from_quick_list_for_project: {
            key : "unhide_descriptor_from_quick_list_for_project",
            label : "Unhide descriptor from quick list for project"
        },
        hide_descriptor_from_quick_list_for_user: {
            key : "hide_descriptor_from_quick_list_for_user",
            label : "Hide descriptor from quick list for user"
        },
        unhide_descriptor_from_quick_list_for_user: {
            key : "unhide_descriptor_from_quick_list_for_user",
            label : "Unhide descriptor from quick list for user"
        },
        reject_descriptor_from_metadata_editor : {
            key : "reject_descriptor_from_metadata_editor",
            label : "Reject descriptor from metadata editor"
        },
        favorite_descriptor_from_quick_list_for_user : {
            key : "favorite_descriptor_from_quick_list_for_user",
            label : "Selected descriptor from manual list"
        },
        unfavorite_descriptor_from_quick_list_for_user : {
            key : "unfavorite_descriptor_from_quick_list_for_user",
            label : "Unfavorite descriptor from quick list for user"
        },
        favorite_descriptor_from_quick_list_for_project : {
            key : "favorite_descriptor_from_quick_list_for_project",
            label : "Favorite descriptor from quick list for project"
        },
        unfavorite_descriptor_from_quick_list_for_project : {
            key : "unfavorite_descriptor_from_quick_list_for_project",
            label : "Unfavorite descriptor from quick list for project"
        },
        reject_ontology_from_quick_list : {
            key : "reject_ontology_from_quick_list",
            label : "Reject ontology from quick list"
        },
        browse_to_next_page_in_descriptor_list : {
            key : "browse_to_next_page_in_descriptor_list",
            label : "Browse to next page in descriptor list"
        },
        browse_to_previous_page_in_descriptor_list : {
            key : "browse_to_previous_page_in_descriptor_list",
            label : "Browse to previous page in descriptor list"
        },
        select_ontology_manually : {
            key : "select_ontology_manually",
            label : "Selected ontology manually"
        },
        select_descriptor_from_manual_list : {
            key : "select_descriptor_from_manual_list",
            label : "Select descriptor from manual list"
        },
        fill_in_inherited_descriptor : {
            key : "fill_in_inherited_descriptor",
            label : "Fill in inherited descriptor"
        }
    },

    activeTabDiv: null,

    renderStackedChart: function(chartTargetDiv, yAxisLabels, yAxisLabel, title, subtitle, series)
    {
        $(chartTargetDiv).highcharts({
            chart: {
                animation: false,
                type: 'bar'
            },
            title: {
                text: title,
                subtitle: subtitle
            },
            xAxis: {
                categories: yAxisLabels
            },
            yAxis: {
                min: 0,
                title: {
                    text: yAxisLabel
                }
            },
            legend: {
                reversed: true
            },
            plotOptions: {
                series: {
                    stacking: 'normal'
                }
            },
            series: series
        });
    },

    renderUserInteractionsChart: {
        perOntology: function (chartTargetDiv, results)
        {
            var stackLayerLabels = [];
            var interactionsByOntology = {};

            var interactionType;
            var ontology;
            var i;

            for(interactionType in Interactions.types)
            {
                if (Interactions.types.hasOwnProperty(interactionType)) {
                    stackLayerLabels.push({
                        name : Interactions.types[interactionType].label
                    });
                }
            }

            var ontologies = [];

            for (i = 0; i < results.length; i++)
            {
                var result = results[i];

                ontology = result.ddr.executedOver.ontology;
                interactionType = result.ddr.interactionType;

                if (ontologies[ontology] == null)
                {
                    ontologies[ontology] = result.ddr.executedOver.ontology;
                }

                if(interactionsByOntology[ontology] == null)
                {
                    interactionsByOntology[ontology] = {};
                }

                if(interactionsByOntology[ontology][interactionType] == null)
                {
                    interactionsByOntology[ontology][interactionType] = 0;
                }

                interactionsByOntology[ontology][interactionType]++;
            }

            //extract the series

            var series = [];

            for(interactionType in Interactions.types)
            {
                if(Interactions.types.hasOwnProperty(interactionType))
                {
                    var barValues = [];

                    for(ontology in ontologies)
                    {
                        if(ontologies.hasOwnProperty(ontology))
                        {

                            if(interactionsByOntology[ontology][interactionType] != null)
                            {
                                barValues.push(interactionsByOntology[ontology][interactionType]);
                            }
                            else
                            {
                                barValues.push(0);
                            }
                        }
                    }

                    series.push({
                        name : Interactions.types[interactionType].label,
                        data : barValues
                    });
                }
            }

            var descriptorLabels = [];
            for(ontology in ontologies)
            {
                if (ontologies.hasOwnProperty(ontology))
                {
                    descriptorLabels.push(ontologies[ontology]);
                }
            }

            Interactions.renderStackedChart(
                chartTargetDiv,
                descriptorLabels,
                "Interactions by ontologies",
                'By ontology',
                'A report on your interaction with the system',
                series
            );
        },

        perDescriptor: function (chartTargetDiv, results)
        {
            var stackLayerLabels = [];
            var interactionsByDescriptor = {};

            var interactionType;
            var descriptor;
            var i;

            for(interactionType in Interactions.types)
            {
                if (Interactions.types.hasOwnProperty(interactionType)) {
                    stackLayerLabels.push({
                        name : Interactions.types[interactionType].label
                    });
                }
            }

            var descriptors = [];

            for (i = 0; i < results.length; i++)
            {
                var result = results[i];

                descriptor = result.ddr.executedOver.prefixedForm;
                interactionType = result.ddr.interactionType;

                if (descriptors[descriptor] == null)
                {
                    descriptors[descriptor] = result.ddr.executedOver;
                }

                if(interactionsByDescriptor[descriptor] == null)
                {
                    interactionsByDescriptor[descriptor] = {};
                }

                if(interactionsByDescriptor[descriptor][interactionType] == null)
                {
                    interactionsByDescriptor[descriptor][interactionType] = 0;
                }

                interactionsByDescriptor[descriptor][interactionType]++;
            }

            //extract the series

            var series = [];
            var countsForDescriptor = {};

            for(interactionType in Interactions.types)
            {
                if(Interactions.types.hasOwnProperty(interactionType))
                {
                    var barValues = [];

                    for(descriptor in descriptors)
                    {
                        if(descriptors.hasOwnProperty(descriptor))
                        {

                            if(interactionsByDescriptor[descriptor][interactionType] != null)
                            {
                                barValues.push(interactionsByDescriptor[descriptor][interactionType]);
                            }
                            else
                            {
                                barValues.push(0);
                            }
                        }
                    }

                    series.push({
                        name : Interactions.types[interactionType].label,
                        data : barValues
                    });
                }
            }

            //sort by number of interactions, descending
            _.sortBy(descriptors,
                function (prefixedForm)
                {
                    return countsForDescriptor[prefixedForm];
                }
            );

            var descriptorLabels = [];
            for(descriptor in descriptors)
            {
                if (descriptors.hasOwnProperty(descriptor))
                {
                    descriptorLabels.push(descriptors[descriptor].prefixedForm);
                }
            }

            Interactions.renderStackedChart(
                chartTargetDiv,
                descriptorLabels,
                "Interactions by descriptor",
                'By descriptor',
                'A report on your interaction with the system',
                series
            );
        }
    }
};