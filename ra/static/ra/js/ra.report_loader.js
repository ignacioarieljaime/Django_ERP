/**
 * Created by ramezashraf on 13/08/16.
 */

(function ($) {

    function failFunction(data, $elem) {
        if (data.status == 403) {
            $elem.hide()
        } else {
            notify_error();
            unblockDiv($elem);
        }
    }

    function loadComponents(data, $elem) {
        let chartElem = $elem.find('[data-report-chart]');
        if (chartElem.length !== 0 && data.chart_settings.length !==0 ) {
            displayChart(data, chartElem);
        }
        let tableElem = $elem.find('[data-report-table]');
        if (tableElem.length !== 0) {
            $.ra.datatable.buildAdnInitializeDatatable(data, tableElem);
        }
        unblockDiv($elem);
    }

    function displayChart(data, $elem) {

        // hand over to the chart plugin

        var chart_id = $elem.attr('data-report-default-chart');
        if (typeof (chart_id) == 'undefined') {
            chart_id = '';
        }
        // var chart = $elem.find('.reportChart');
        let chart = $elem;
        // var chartObject = $.ra.dataComprehension.getObjFromArray(data.chart_settings, 'id', chart_id, true)['settings'];

        let chartObject = data.chart_settings[0]
        //chartObject = group_chart_objects[report_slug][chart_id];
        // if (typeof (chartObject) === 'undefined') {
        //     console.log(chart_id + " can't be found in the charts for this report")
        // }
        chartObject = $.ra.highchart.createChartObject(data, chartObject);
        chart.highcharts(chartObject);

        // let chartObject = $.slick_reporting.chartsjs.createChartObject(data,chart_id, {});
        // new Chart($elem, chartObject);

        unblockDiv($elem);
    }

    function refreshReportWidget($elem, no_cache) {
        no_cache = no_cache || true;
        // var report_slug = $elem.attr('data-report-slug');
        let successFunctionName = $elem.attr('data-success-callback');
        successFunctionName = successFunctionName || "$.ra.report_loader.loadComponents";
        let failFunctionName = $elem.attr('data-fail-callback');
        failFunctionName = failFunctionName || "$.ra.report_loader.failFunction";
        let url = $elem.attr('data-report-url');
        let extraParams = $elem.attr('data-extra-params') || '';

        if (url === '#') return; // there is no actual url, probably not enough permissions
        else url = url + '?';


        // if (no_cache) url = url + '&no-cache' + _getDateFormParams($elem.parents('.panel'));
        if (extraParams !== '') {
            url = url + extraParams;
        }

        $.get(url, function (data) {
            $.ra.cache[data['report_slug']] = jQuery.extend(true, {}, data);
            executeFunctionByName(successFunctionName, window, data, $elem);
        }).fail(function (data) {
            executeFunctionByName(failFunctionName, window, data, $elem);
            blockDiv($elem);
            //failFunction($elem, data);
        });

    }

    function _getDateFormParams($panel) {
        var date_params = '';
        var dateForm = $panel.find('form.widgetDateForm');
        if (dateForm.length > 0) date_params = dateForm.serialize();
        return '&' + date_params;

    }

    function attachDatePicker() {
        var btnFormat = 'D MMMM YYYY';
        var pickers = $('.daterange-ranges');
        pickers.each(function (i, el) {
            var $el = $(el);
            var dateForm = $(el).parents('.widgetDatePickerContainer').find('form.widgetDateForm');
            if (dateForm.length > 0) {
                var $startDate = dateForm.find('[name=from_doc_date_0]');
                var $startTime = dateForm.find('[name=from_doc_date_1]');
                var $endDate = dateForm.find('[name=to_doc_date_0]');
                var $endTime = dateForm.find('[name=to_doc_date_1]');
                var start_date = $startDate.val();
                var start_time = $startTime.val() || '00:00';
                var end_date = $endDate.val();
                var end_time = $endTime.val() || '00:00';
                var startDate = start_date + ' ' + start_time;
                var endDate = end_date + ' ' + end_time;
            } else {
                startDate = moment().subtract('month', 1);
                endDate = moment();

            }
            var settings = {
                startDate: startDate,
                endDate: endDate,
                //maxDate: endDate,
            };
            settings = $.extend(true, DEFAULT_DATE_PICKER_OBJ, settings);


            $el.daterangepicker(settings);
            $el.find('span').html(moment(startDate).format(btnFormat) + ' &nbsp; - &nbsp; ' + moment(endDate).format(btnFormat));
            $el.on('apply.daterangepicker', function (ev, picker) {

                var container = picker.element.parents('.widgetDatePickerContainer').find('form.widgetDateForm');
                var $startDate = container.find('[name=from_doc_date_0]');
                var $startTime = container.find('[name=from_doc_date_1]');
                var $endDate = container.find('[name=to_doc_date_0]');
                var $endTime = container.find('[name=to_doc_date_1]');
                $startDate.val(picker.startDate.format('YYYY') + '-' + picker.startDate.format('MM') + "-" + picker.startDate.format('DD'));
                $startTime.val(picker.startDate.format('HH') + ":" + picker.startDate.format('mm'));
                $endDate.val(picker.endDate.format('YYYY') + '-' + picker.endDate.format('MM') + "-" + picker.endDate.format('DD'));
                $endTime.val(picker.endDate.format('HH') + ":" + picker.endDate.format('mm'));
                //var dStart = picker.startDate._d;
                $el.find('span').html(picker.startDate.format(btnFormat) + ' &nbsp; - &nbsp; ' + picker.endDate.format(btnFormat));
                var chartWidget = picker.element.parents('.panel').find('.chartWidget');
                refreshReportWidget(chartWidget, false);


            })

        });

    }

    function loadChartWidgets() {
        // Main
        $('[data-report-widget]').each(function (i, elem) {
            var $elem = $(elem);
            refreshReportWidget($elem);
        });

        $('.printReportWidget').on('click', function (e) {
            e.preventDefault();
            var $panel = $(this).parents('.panel');
            var url = $panel.find('.chartWidget').attr('data-report-url') + '&print=true';
            url = url + _getDateFormParams($panel);
            var win = window.open(url, '_blank');
            if (win) {
                //Browser has allowed it to be opened
                win.focus();
            }
        });
        $('.refreshReportWidget').on('click', function (e) {
            e.preventDefault();
            refreshReportWidget($(this).parents('.panel').find('.chartWidget'))
        });

        attachDatePicker();

    }

    function getDataFromServer(url, success_function, fail_function) {
        $.get(url, success_function).fail(fail_function);
    }

    function createChartsUIfromResponse(data, a_class) {
        a_class = typeof a_class == 'undefined' ? 'groupChartController' : a_class;
        // Create the chart container from data available in report response
        var $container = $('<div></div>');
        if (typeof (data['chart_settings']) == 'undefined') {
            // ie no charts for this report
            return ''
        }
        var chartList = data['chart_settings'];
        var report_slug = data['report_slug'];
        if (chartList.length != 0) {
            $container.append('<div class="groupChartControllers">' +
                '<ul class="nav nav-charts"></ul></div>');
        }
        var ul = $container.find('ul');
        for (var i = 0; i < chartList.length; i++) {
            var icon;
            var chart = chartList[i];
            if (chart.disabled) continue;
            var chart_type = chart.type;
            if (chart_type == 'pie') icon = '<i class="fas fa-chart-pie"></i>';
            else if (chart_type == 'line') icon = '<i class="fas fa-chart-line"></i>';
            else if (chart_type == 'area') icon = '<i class="fas fa-chart-area"></i>';
            else icon = '<i class="fas fa-chart-bar"></i>';

            ul.append('<li class="nav-link"><a href class="' + a_class + '" data-chart-id="' + chart.id + '" ' +
                'data-report-slug="' + report_slug + '">' + icon + ' ' + capfirst(chart.title) + '</a></li>')
        }
        return $container
    }

    function displayReport(data, url) {
        // Default entry point for report data display
        // Parameters are
        // 1. `data` the json object returned from server which must have keys `report_slug`, `data`, `columns` & `column_names`
        // 2. `url` : Needed mainly for datatables.net flow

        var report_slug = data['report_slug'];

        if (typeof (report_slug) == 'undefined') {
            console.error("Can not proceed: Data returned from server is missing `report_slug` key. " +
                "Present keys are : " + Object.keys(data));
            return;
        }
        var $tabcontent = $('#' + report_slug);
        var table = $tabcontent.find('.report-table');
        var form_settings = data['form_settings'] || {};
        var frontend_settings = form_settings['frontend_settings'] || {};

        $tabcontent.find('.chartContainer .controls').html($.ra.report_loader.createChartsUIfromResponse(data));
        table.html('');
        $.ra.datatable.destroyAllFixedHeaders();
        $.ra.datatable.buildAdnInitializeDatatable(data, table, {
            datatableContainer: table,
            enableFixedHeader: false,
            ajax_url: url,
            datatableOptions: {css_class: 'display compact'}
        });
        unblockDiv($tabcontent);
        $.ra.cache[report_slug] = data;
        $tabcontent.find('.groupChartControllers').find('a:first').trigger('click');
    }

    $.ra.report_loader = {
        cache: $.ra.cache,
        loadChartWidgets: loadChartWidgets,
        failFunction: failFunction,
        displayChart: displayChart,
        getDataFromServer: getDataFromServer,
        createChartsUIfromResponse: createChartsUIfromResponse,
        displayReport: displayReport,
        loadComponents: loadComponents,

    }
})(jQuery);