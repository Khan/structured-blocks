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
            fill(255, 0, 0);
        },
        function() {
            rect(10, 10, 50, 50);
        },
        function() {
            ellipse(20, 20, 100, 100);
        }
    ];

    var code = "fill(255, 0, 0);\nellipse(10, 20, 30, 40);";

    window.toolboxEditor = new JSToolboxEditor({
        el: $("#structured-blocks"),
        toolbox: toolbox,
        code: code
    });

    toolboxEditor.on("updated", function() {
        $("#output").val(this.toScript());
    });

    $("#output").val(toolboxEditor.toScript());
});