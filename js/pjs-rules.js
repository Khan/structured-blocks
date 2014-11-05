var PJSEllipse = JSRules.addRule(JSASTRule.extend({
    structure: function() {
        ellipse(_, _, _, _);
    },

    className: "block block-statement",

    render: function() {
        this.$el.html([
            "ellipse(",
            this.children._[0].render().$el, ",",
            this.children._[1].render().$el, ",",
            this.children._[2].render().$el, ",",
            this.children._[3].render().$el,
            ");"
        ]);
        return this;
    }
}));