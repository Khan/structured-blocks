// TODO: Generate blocks for statements from AST automatically

// TODO: Generate AST/Code

// TODO: Sync position of element immediately on initial drag in

// TODO: Destroy To drag on leave drop
// TODO: Find a way to drag sub-components
//  - Be able to move a sub-component into another blank
//    - Limit it by the "type" and the accepted type
//  - Be able to "destroy" an existing sub-component - some how?

// TODO: Find a way to dynamically manage variables in the toolbox

$(function() {
    var toolbox = [
        function() {
            var name = true;
        },
        function() {
            var foo = false;
        },
        function() {
            ellipse(20, 20, 100, 100);
        },
        {"type": "Literal", "value": 10},
        {"type": "Literal", "value": true}
    ];

    var code = "var a = true;\nellipse(10, 20, 30, 40);";

    window.toolboxEditor = new JSToolboxEditor({
        el: $("#structured-blocks"),
        toolbox: toolbox,
        code: code
    });

    toolboxEditor.on("update", function(code) {
        $("#output").val(code.toScript());
    });
});