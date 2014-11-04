var JSEditor = Backbone.View.extend({
    initialize: function(options) {
        var code = options.code;

        if (typeof code === "string") {
            code = JSRules.parseProgram(code);
        }

        this.code = code;
    },

    render: function() {
        
    }
});

var JSToolbox = Backbone.View.extend({
    initialize: function(options) {
        var toolbox = options.toolbox || [];

        toolbox = toolbox.map(function(item) {
            if (typeof item === "object") {
                return item;
            }

            return JSRules.parseStructure(item);
        });

        this.toolbox = toolbox;
    }
});

var JSToolboxEditor = Backbone.View.extend({
    initialize: function(options) {
        this.editor = new JSEditor({
            code: options.code
        });

        this.toolbox = new JSToolbox({
            toolbox: options.toolbox
        });
    },

    genComponent: function(data, props) {
        if (!this.key) {
            this.key = 0;
        }

        return <JSRule data={data} key={this.key++}
            draggable={true}
            editable={props.editable}/>;
    },

    render: function() {
        this.$el
        return <div>
            <SortableArea
                ref="editor"
                className="editor"
                data={this.state.code}
                accept={true}
                editable={true}
                genComponent={this.genComponent}
                onReorder={() => true}/>
            <SortableArea
                className="toolbox"
                data={this.state.toolbox}
                accept={false}
                editable={false}
                genComponent={this.genComponent}
                onReorder={() => true}
                reorder={false}/>
        </div>;
    }
});

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

    var toolboxEditor = new JSToolboxEditor({
        el: "#structured-blocks",
        toolbox: toolbox,
        code: code
    });

    setInterval(function() {
        $("#output").val(toolboxEditor.editor.toScript());
    }, 100);
});