function initDropZone(context, csrf, folderId) {

	var oDrop = document.getElementById('DROP_ZONE');
	if (oDrop) { 
	  function uploadFiles(files){
	  	  if (!files || files.length == 0) {
	  	  	alert("Nothing to upload.")
	  	  	return;
	  	  }

	      var url = '/admin/document/upload?_csrf=' + csrf;
	      var xhr = new XMLHttpRequest();
	      var fd = new FormData();
	      xhr.open("POST", url, true);

	      xhr.onreadystatechange = function() {
	          if (xhr.readyState == 4) {
	            if (xhr.status == 200) {
	              // Every thing ok, file uploaded
	              window.location.href= context + "/document/list?folderId=" + folderId;
	            } else {
	              alert("Something went wrong: " + xhr.status + ' : ' + xhr.responseText);

	            }  
	          }
	      };

	      var formData = new FormData();
	      formData.append('docId', folderId);
	      for (var i=0; i<files.length; i++) {
	      	formData.append('myfile', files[i]);	
	      } 
	      

	      xhr.send(formData);
	  }

	  var onDrop = function(ev) {
	    ev.preventDefault();
	    
	    // If dropped items aren't files, reject them
	    var dt = ev.dataTransfer;
	    var files = [];
	    if (dt.items) {
	      // Use DataTransferItemList interface to access the file(s)
	      for (var i=0; i < dt.items.length; i++) {
	        if (dt.items[i].kind == "file") {
	          var f = dt.items[i].getAsFile();
	          files.push(f);
	        }
	      }
	    } else {
	      // Use DataTransfer interface to access the file(s)
	      for (var i=0; i < dt.files.length; i++) {
	        files.push(dt.files[i]);
	      }  
	    }

	    uploadFiles(files);


	    this.style.background = '';
	  }
	  oDrop.addEventListener('drop',onDrop);

	  oDrop.addEventListener('dragdrop', onDrop);

	  
	  oDrop.addEventListener('dragenter',function(ev){
	    ev.preventDefault();
	    var self = this;
	    setTimeout(function() {
	      self.parentNode.style.background = '#eee';
	    }, 100);
	    
	  })
	  oDrop.addEventListener('dragleave',function(){
	    var self = this;
	    setTimeout(function() {
	      self.parentNode.style.background = '';
	    }, 100);
	    
	  })
	  oDrop.addEventListener('dragover',function(ev){
	    ev.preventDefault();

	    var self = this;
	    setTimeout(function() {
	      self.parentNode.style.background = '#eee';
	    }, 100);
	  })

	  // oDrop.addEventListener('dragend',function(ev){
	  //   this.style.background = '';
	  // })
	}

	}