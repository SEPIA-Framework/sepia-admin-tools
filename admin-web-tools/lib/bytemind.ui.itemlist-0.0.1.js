//requires: 

//list with rich items
function bytemind_build_ui_itemlist(){
	
	var ItemList = function(options){
		
		var self = this;
		
		var id = "";
		var headerMenue = [];
		var itemMenue = [];
		
		var autoSize = true;
		self.isMinimized = false;
		
		var autoSave = false;

		//read options
		if (options){
			if ('id' in options) this.id = options.id;
			
			if ('headerMenue' in options) this.headerMenue = options.headerMenue;
			if ('itemMenue' in options) this.itemMenue = options.itemMenue;
			
			if ('autoSize' in options) this.autoSize = options.autoSize;
			if ('autoSave' in options) this.autoSave = options.autoSave;
		};
		
		//create list container with basic elements
		var listContainer = document.createElement('div');
		listContainer.className = 'bytemind-flexSize-container';
		
		self.getListElement = function(){
			return listContainer;
		}
	}
	return ItemList;
}