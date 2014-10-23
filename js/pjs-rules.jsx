var PJSEllipse = JSRules.addRule({
    mixins: [BlockMixin, JSMixin, JSASTMixin],

    statics: {
        structure: JSRules.parseStructure(function() {
            ellipse(_, _, _, _);
        })
    },

    getType: function(match) {
        return "statement";
    },

    render: function() {
        var children = this.getChildComponents();
        return <div className="block block-statement">
            {'ellipse('}
            <BlankInput>{children._[0]}</BlankInput>{', '}
            <BlankInput>{children._[1]}</BlankInput>{', '}
            <BlankInput>{children._[2]}</BlankInput>{', '}
            <BlankInput>{children._[3]}</BlankInput>{');'}
        </div>;
    }
});