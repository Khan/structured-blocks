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