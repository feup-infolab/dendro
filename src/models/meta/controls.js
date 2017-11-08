const Controls = function ()
{};

let controlTypes = {
    date_picker: 'date_picker',
    input_box: 'input_box',
    markdown_box: 'markdown_box',
    map: 'map',
    url_box: 'url_box',
    regex_checking_input_box: 'regex_checking_input_box',
    combo_box: 'combo_box'
};

for (let controlType in controlTypes)
{
    Controls[controlType] = controlTypes[controlType];
}

module.exports.Controls = Controls;
