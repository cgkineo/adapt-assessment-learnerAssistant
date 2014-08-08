define(function(require) {

	//return parent element if element is hidden
	function ifIdOffsetHiddenReturnParentId(id) {
        if (ifIdOffsetHiddenReturnParentId.swapOutIds[id] !== undefined) return ifIdOffsetHiddenReturnParentId.swapOutIds[id];

        var $element = $("." + id);
        var displayNoneParents = _.filter($element.parents(), function(item) { return $(item).css("display") == "none"; } );
        if (displayNoneParents.length === 0) return id;

        var parentId = Adapt.findById(id).get("_parentId");
        ifIdOffsetHiddenReturnParentId.swapOutIds[id] = parentId;
        return parentId;
    }
    ifIdOffsetHiddenReturnParentId.swapOutIds = {};

    window.ifIdOffsetHiddenReturnParentId = ifIdOffsetHiddenReturnParentId;

});