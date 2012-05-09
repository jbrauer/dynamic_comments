(function($){

  /**
   * Theme functions
   */
  Drupal.theme.prototype.dynamicCommentsSidebarHTML = function () {
    var sidebar_HTML = '<div id="dynamic-comments-sidebar" class="dynamic-comments-sidebar">\n\
                          <div class="dynamic-comments-sidebar-messages">\n\
                          </div>\n\
                          <div class="dynamic-comments-sidebar-inner">\n\
                          </div>\n\
                        </div>';
    return sidebar_HTML;
  };

  Drupal.theme.prototype.dynamicCommentsIconsContainerHTML = function () {
    var icons_container_HTML = '<div class="dynamic-comments-icons">\n\
                                </div>';
    return icons_container_HTML;
  }

  Drupal.theme.prototype.dynamicCommentsCommentWindowHTML = function () {
    var comment_window_HTML = '<div id="current-dynamic-comments-window" class="dynamic-comments-window">\n\
                                 <div class ="dynamic-comments-window-inner">\n\
                                   <div class="post-comment-title">Post a comment</div>\n\
                                   <div class="window-close">X</div>\n\
                                   <textarea class="post-comment-text" rows="2" cols="20"></textarea>\n\
                                   <div class="post-comment-button">Post</div>\n\
                                 </div>\n\
                               </div>'
    return comment_window_HTML;
  }

  Drupal.theme.prototype.dynamicCommentsCommentWindowHTMLSidebar = function () {
    var comment_window_HTML_sidebar = '<div id="current-dynamic-comments-window" class="dynamic-comments-window child">\n\
                                    <div class ="dynamic-comments-window-inner">\n\
                                      <textarea class="post-comment-text" rows="2" cols="21"></textarea>\n\
                                        <div class="post-comment-button">Post</div>\n\
                                        <div class="window-close">Cancel</div>\n\
                                    </div>\n\
                                  </div>'
    return comment_window_HTML_sidebar;
  }
  
  Drupal.theme.prototype.dynamicCommentsCommentObjIcon = function (commentObj) {
    var icon     = '<span class="dynamic-comments-comment-icon" id="' + commentObj.cid + '" style="position:absolute; top:' + commentObj.position.top + 'px; left:' + commentObj.position.left + 'px;">';
        icon    += 'comment';
        icon    += '</span>';
    return icon;
  }
  
  Drupal.theme.prototype.dynamicCommentsCommentObjHTML = function (commentObj, childClasses, resolvedClass) {
    var html     = '<div class="dynamic-comments-comment comment-' + commentObj.cid + ' ' + childClasses + ' ' + resolvedClass + '" id="' + commentObj.cid + '" resolved="' + commentObj.status + '">';
        html    += '<div class="dynamic-comments-comment-user">';
        html    += '<img src="/' + commentObj.user_picture + '" class="user-picture"/>';
        html    += '<span class="user-name"><em>' + commentObj.user_name + ' said:</em></span>';
        html    += '</div>';
        html    += '<div class="dynamic-comments-comment-inner">';
        html    += '<span>' + commentObj.comment + '</span>';
        html    += '<div class="comment-delete">X</div>';
        if (commentObj.parent == 0) {
          html    += '<div class="reply-comment-button">Reply</div>';
        }
        if (commentObj.status == 0) {
          html    += '<div class="resolve-comment-button">Resolve</div>';
        }
        if (commentObj.status == 1) {
          html    += '<div class="resolved-comment">Resolved!</div>';
        }
        html    += '</div>';
        html    += '</div>';
    return html;
  }

  Drupal.behaviors.dynamic_comments = function(context) {

    // bring module settings locally
    var nid               =   Drupal.settings.dynamic_comments.nid;
    var user              =   Drupal.settings.dynamic_comments.user;
    var post_path         =   Drupal.settings.dynamic_comments.post_path;
    var refresh_interval  =   Drupal.settings.dynamic_comments.refresh_interval;
    var content_area      =   Drupal.settings.dynamic_comments.content_area;
    var allow_comments    =   Drupal.settings.dynamic_comments.allow_comment_window || 1;
    var serializedSelection, selectionPosition, status = 0;
    Drupal.behaviors.dynamic_comments.currentSelection = null;

    // add class to apply the line spacing increase
    $(content_area).addClass('dynamic-comments-content');

    // build the ui
    Drupal.behaviors.dynamic_comments.ui.renderUi();

    // get all comments on page load
    Drupal.behaviors.dynamic_comments.connections.retrieveData(post_path, nid);

    // function to call from interval
    // seems very complicated to pass arguments in the string mode setInterval needs
    // the function to be passed, thus needing this wrapper function
    // @TODO: this continue refresh resets the focus on the last comment selection
    // need to find a way to avoid this default selection
    Drupal.behaviors.dynamic_comments.retrieveDataTimer = function() {
      Drupal.behaviors.dynamic_comments.connections.retrieveData(post_path, nid);
    };

    setInterval('Drupal.behaviors.dynamic_comments.retrieveDataTimer()', refresh_interval);

    // bind mouseup function to node body
    $(content_area).mouseup(function(e) {
      // window already open, so close it
      if (document.getElementById('current-dynamic-comments-window')) {
        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();
        Drupal.behaviors.dynamic_comments.ui.clearActiveItems();
      }
      // no window open, run Rangy to get a selection object and serialize it
      else {
        Drupal.behaviors.dynamic_comments.ui.clearActiveItems();
        var selection = rangy.getSelection();
        if (selection.anchorNode == selection.focusNode) {

          // this means there is nothing really selected, so we do not open a window
          // @TODO: note for future - allowing empty selections breaks the comment object when it comes
          // back from the database. Unfortunately it messes the submission and appearance of any other comment
          // afterwards, so not allowing empty selection comments seems like the right solution at this time,
          // double clicking on a word should select it, just like highlighting it would do
          if (selection.anchorOffset == selection.focusOffset) {
            // do something to avoid JS errors on the selection
            return false;
          }
          // @TODO: maybe there is a better way to centralize these two elses so we do not write repetitive functions
          else {
            // get the selection serialized and open a window in the mouseup coordinates
            serializedSelection = rangy.serializeSelection(selection, true);
            selectionPosition = JSON.stringify(Drupal.behaviors.dynamic_comments.commentObject.getPosition(selection));
            Drupal.behaviors.dynamic_comments.ui.buildCommentWindow(e.pageX, e.pageY, 'body', allow_comments);
          }
        }
        else {
          // same as above else
          serializedSelection = rangy.serializeSelection(selection, true);
          selectionPosition = JSON.stringify(Drupal.behaviors.dynamic_comments.commentObject.getPosition(selection));
          Drupal.behaviors.dynamic_comments.ui.buildCommentWindow(e.pageX, e.pageY, 'body', allow_comments);
        }

      }
    });

    // bind keydown event to use ESC to close the current window
    $('.dynamic-comments-window').live('keydown', function(e){
      if (e.keyCode == 27) {
        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();
      }
    });

    $('.dynamic-comments-window').live('click', function(e) {
      e.stopPropagation();
    });

    // bind click function to every window post button that's created
    $('.dynamic-comments-window .post-comment-button').live('click', function(){
      // get value from textfield
      // @TODO: take action when textfield doesn't validate, some sort of error focus or so
      var comment = $(this).siblings('textarea.post-comment-text').val();
      var parent;

      if (comment !== '') {
        if ($(this).parents('.dynamic-comments-window').hasClass('child')) {
          parent = $(this).parents('.dynamic-comments-comment').attr('id');
          for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
            if (parent === Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
              serializedSelection = Drupal.behaviors.dynamic_comments.commentsArray[i].range;
            }
          }
        }
        else {
          parent = 0;
        }

        // send data to the server, close the current window and refresh comments on sidebar
        Drupal.behaviors.dynamic_comments.connections.postData(post_path, nid, comment, serializedSelection, user, parent, selectionPosition, status);
        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();

        setTimeout(function(){
          Drupal.behaviors.dynamic_comments.connections.retrieveData(post_path, nid);
        }, 1000);
      }

    });

    // bind click function on the sidebar comments to show the highlighted text
    $('#dynamic-comments-sidebar .dynamic-comments-comment').live('click', function(e){
      if (e.isPropagationStopped()) {
        return;
      };

      if (e.type == 'click') {
        var element;

        // click on a nested child should highlight the parent
        if ($(this).hasClass('nested-child')) {
          // get classes and find the 'child-of-X' classe to get the parent id
          var classList = $(this).attr('class').split(/\s+/);
          var child_of, id;

          for (i in classList) {
            if (classList[i].search(/child-of-/i) != -1) {
              child_of = classList[i];
            }
          }

          id = child_of.split('-of-');
          // element is the parent
          element = $('#dynamic-comments-sidebar .dynamic-comments-comment.comment-' + id[1]);
        }
        else {
          // element is a top level comment
          element = $(this);
        }

        Drupal.behaviors.dynamic_comments.ui.clearActiveItems();
        element.addClass('active');
        $('.dynamic-comments-comment-icon#' + element.attr('id')).addClass('active');

        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();

        current_selection = null;

        for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
          if (element.attr('id') === Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
            current_selection = rangy.deserializeSelection(Drupal.behaviors.dynamic_comments.commentsArray[i].range);
            $.scrollTo($('.dynamic-comments-comment-icon#' + element.attr('id')), 500, {
              offset:-200
            });
          }
        }
      }
    });

    // bind click function to the comments icons
    $('.dynamic-comments-comment-icon').live('click', function(e){
      if (e.type == 'click') {
        Drupal.behaviors.dynamic_comments.ui.clearActiveItems();
        $(this).addClass('active');

        $('.dynamic-comments-comment.comment-' + $(this).attr('id')).addClass('active');
        $('#dynamic-comments-sidebar').scrollTo($('.dynamic-comments-comment.active'),500, {
          offset:-200
        });

        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();

        current_selection = null;

        for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
          if ($(this).attr('id') === Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
            current_selection = rangy.deserializeSelection(Drupal.behaviors.dynamic_comments.commentsArray[i].range);
          }
        }
      }
    });

    // bind click function to the delete comment X
    $('.comment-delete').live('click', function(e){
      if (e.type == 'click') {
        for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
          if ($(this).parents('.dynamic-comments-comment').attr('id') === Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
            Drupal.behaviors.dynamic_comments.connections.deleteData(post_path, nid, Drupal.behaviors.dynamic_comments.commentsArray[i].cid, user, Drupal.behaviors.dynamic_comments.commentsArray[i].parent);
          }
        }

        Drupal.behaviors.dynamic_comments.connections.retrieveData(post_path, nid);

        return false;
      }
    });

    // bind click function to the resolve comment icon
    $('.resolve-comment-button').live('click', function(e){
      if (e.type == 'click') {
        for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
          if ($(this).parents('.dynamic-comments-comment').attr('id') === Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
            if (Drupal.behaviors.dynamic_comments.commentsArray[i].status == 0) {
              status = 1;
              Drupal.behaviors.dynamic_comments.connections.updateData(post_path, nid, Drupal.behaviors.dynamic_comments.commentsArray[i].cid, user, Drupal.behaviors.dynamic_comments.commentsArray[i].parent, status);
            }
          }
        }

        status = 0;
        Drupal.behaviors.dynamic_comments.connections.retrieveData(post_path, nid);

        return false;
      }
    });

    // bind click function to the reply comment
    $('.reply-comment-button').live('click', function(e) {
      Drupal.behaviors.dynamic_comments.ui.buildCommentWindow(0, 0, $(this).parents('.dynamic-comments-comment'));
      return false;
    });
  }

  /*
   * Objects to be used in the implementation
   *
   *
   **/

  // array to hold comment objects
  Drupal.behaviors.dynamic_comments.commentsArray = [];

  // object for current screen selection
  // @TODO: figure out why selection doesn't go away when we set this to null'\
  Drupal.behaviors.dynamic_comments.currentSelection = {};

  // object for css applier
  Drupal.behaviors.dynamic_comments.cssApplier = {};

  // UI object
  Drupal.behaviors.dynamic_comments.ui = {
    // ui basic elements' markup
    sidebar_HTML : Drupal.theme('dynamicCommentsSidebarHTML'),
    icons_container_HTML : Drupal.theme('dynamicCommentsIconsContainerHTML'),
    // pop-up to post comment
    comment_window_HTML : Drupal.theme('dynamicCommentsCommentWindowHTML'),
    // comment in the sidebar
    comment_window_HTML_sidebar : Drupal.theme('dynamicCommentsCommentWindowHTMLSidebar'),

    // build the basic ui elements, function generaly called on page load
    renderUi : function() {
      // create sidebar container for comments and add class for the body right margin
      // @TODO: implementing a slide in and slide out effect on the sidebar seems to mess the
      // position of the icons in the screen.
      $('body').append(this.sidebar_HTML)
      .addClass('dynamic-comments-sidebar-active');

      // create container for comment icons
      $('.dynamic-comments-content').append(this.icons_container_HTML);

      return false;
    },

    // comment window pop-up creation
    buildCommentWindow : function(x, y, where_to_append, allow_comments_window) {
      // make sure there isn't other window displaying at the time
      this.closeCommentWindows();

      // this is a comment window to append to the body
      if (where_to_append == 'body' && allow_comments_window != 0) {

        $('body').append(this.comment_window_HTML);
        $('.dynamic-comments-window').css({
          position: "absolute",
          top: y,
          left: x
        });
      };

      if (typeof where_to_append === 'object') {
        var comment = $(where_to_append).attr('id');
        $('.dynamic-comments-comment.comment-' + comment).append(this.comment_window_HTML_sidebar);
      };

      // bind close function to X and get focus to textfield
      // @TODO: bring click function binding to post button inside this object also
      $('.dynamic-comments-window .window-close').click(function(){
        Drupal.behaviors.dynamic_comments.ui.closeCommentWindows();
      });
      $('.dynamic-comments-window .post-comment-text').focus();

    },

    // close all comment windows
    closeCommentWindows : function() {
      $('.dynamic-comments-window').remove();

      return false;
    },

    // clear all active classes in comments and icons
    // @TODO: maybe convert this to a method in the comment object itself
    clearActiveItems : function() {
      $('#dynamic-comments-sidebar .dynamic-comments-comment').removeClass('active');
      $('.dynamic-comments-comment-icon').removeClass('active');

      return false;
    },

    // shows a status message on top of the sidebar, when sent from the server
    // @TODO: slide effect?
    postMessage : function(message) {

      var local_message = eval('(' + message + ')');
      var messages_div = $('.dynamic-comments-sidebar .dynamic-comments-sidebar-messages');

      messages_div.addClass(local_message.severity + ' visible')
      .html(local_message.message);

      setTimeout(function(){
        messages_div.removeClass(local_message.severity + ' visible')
        .html('');
      }, 3000);
    },

    // compares the current comments in the UI with the objects array and erases
    // any comment that doesn't have an object counterpart
    cleanupComments : function() {
      // function to check if changes in the comment array are being
      // reflected in the UI
      function inArray(id, resolved, objArray) {
        var length = objArray.length;

        for(var i = 0; i < length; i++) {
          if(objArray[i].cid == id) {
            if (objArray[i].status == resolved) {
              return [true, 'same'];
            }
            else {
              return [true, 'updated'];
            }
          }
        }
        return false;
      }

      $('.dynamic-comments-comment').each(function(e) {

        var id = $(this).attr('id');
        var resolved = $(this).attr('resolved');
        var in_array = inArray(id, resolved, Drupal.behaviors.dynamic_comments.commentsArray);

        if (!in_array) {
          $(this).remove();
          $('dynamic-comments-comment-icon#' + id).remove();
        }

        if (in_array[0] && in_array[1] == 'updated') {
          for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
            if (id == Drupal.behaviors.dynamic_comments.commentsArray[i].cid) {
              Drupal.behaviors.dynamic_comments.commentsArray[i].update();
            }
          }
        }
      });
    }
  }

  // connections object
  Drupal.behaviors.dynamic_comments.connections = {
    // general function to post data to the server
    postData : function(post_path, nid, comment, range, user, parent, position, status) {

      $.post(post_path,
        Drupal.behaviors.dynamic_comments.sendObject.create('insert',nid, comment, range, user, parent, position, status),
        function(data) {

          Drupal.behaviors.dynamic_comments.ui.postMessage(data);
        }
      );
    },

    // general function to retrieve data from the server
    retrieveData : function(post_path, nid) {
      $.post(post_path,
        Drupal.behaviors.dynamic_comments.sendObject.create('retrieve',nid),
        function(data) {
          var jsonObj = eval('(' + data + ')');

          Drupal.behaviors.dynamic_comments.commentsArray.length = 0;

          // fill commentsArray with the objects from the server
          for (var key in jsonObj) {
            Drupal.behaviors.dynamic_comments.commentsArray.push(Drupal.behaviors.dynamic_comments.commentObject.create(jsonObj[key]));
          }

          // erase comments that don't have a counterpart in objects array
          Drupal.behaviors.dynamic_comments.ui.cleanupComments();

          // execute the print method for each comment object, so they display in the UI
          // @TODO: should this be separated from the retrieveData method?
          for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
            // print comments without parents first, to make sure we have them
            // in the DOM when attaching their children
            if (Drupal.behaviors.dynamic_comments.commentsArray[i].parent == 0) {
              Drupal.behaviors.dynamic_comments.commentsArray[i].print();
            }
          }

          // print children since the parents are already in the DOM
          for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
            if (Drupal.behaviors.dynamic_comments.commentsArray[i].parent != 0) {
              Drupal.behaviors.dynamic_comments.commentsArray[i].print();
            }
          }
        });
    },

    // general function to delete data from the server
    deleteData : function(post_path, nid, comment, user, parent) {

      $.post(post_path,
        Drupal.behaviors.dynamic_comments.sendObject.create('delete',nid, comment, null, user, parent),
        function(data) {
          Drupal.behaviors.dynamic_comments.ui.postMessage(data);

          var local_data = eval('(' + data + ')');

          if (local_data.status == 'ok') {
            for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
              if (Drupal.behaviors.dynamic_comments.commentsArray[i].parent === local_data.comment) {
                Drupal.behaviors.dynamic_comments.commentsArray[i].erase();
              }
            }

            for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
              if (Drupal.behaviors.dynamic_comments.commentsArray[i].cid === local_data.comment) {
                Drupal.behaviors.dynamic_comments.commentsArray[i].erase();
              }
            }
          }

        });
    },

    // general function to update data from the server
    updateData : function(post_path, nid, comment, user, parent, status) {

      $.post(post_path,
        Drupal.behaviors.dynamic_comments.sendObject.create('update',nid, comment, null, user, parent, null, status),
        function(data) {
          Drupal.behaviors.dynamic_comments.ui.postMessage(data);

          var local_data = eval('(' + data + ')');

          if (local_data.status == 'ok') {
            for (i in Drupal.behaviors.dynamic_comments.commentsArray) {
              if (Drupal.behaviors.dynamic_comments.commentsArray[i].cid === local_data.comment) {
                Drupal.behaviors.dynamic_comments.commentsArray[i].update();
              }
            }
          }
        });
    }
  }

  // prepare the post vars to be sent to the server
  // @TODO: improve this code with a switch statement
  Drupal.behaviors.dynamic_comments.sendObject = {
    create : function(action, nid, comment, range, user, parent, position, status) {

      if (action == 'insert') {
        var object = {
          "action"   : "insert",
          "token"    : Drupal.settings.dynamic_comments.security_token,
          "range"    : range,
          "comment"  : comment,
          "nid"      : nid,
          "user"     : user,
          "parent"   : parent,
          "position" : position,
          "status"   : status
        }
      }

      if (action == 'retrieve') {
        var object = {
          "action"  : "retrieve",
          "token"   : Drupal.settings.dynamic_comments.security_token,
          "nid"     : nid
        }
      }

      if (action == 'delete') {
        var object = {
          "action"  : "delete",
          "token"   : Drupal.settings.dynamic_comments.security_token,
          "nid"     : nid,
          "comment" : comment,
          "user"    : user,
          "parent"  : parent
        }
      }

      if (action == 'update') {
        var object = {
          "action"  : "update",
          "token"   : Drupal.settings.dynamic_comments.security_token,
          "nid"     : nid,
          "comment" : comment,
          "user"    : user,
          "parent"  : parent,
          "status"  : status
        }
      }
      return object;
    }
  }

  // object for each comment in the screen
  Drupal.behaviors.dynamic_comments.commentObject = {
    create : function(comment) {

      // json string to object
      var commentObj = eval('(' + comment + ')');

      // get position for icon placement
      if (commentObj.position != 'undefined') {
        commentObj.position = JSON.parse(commentObj.position);
      }
      else {
        commentObj.position = {
          top: 0,
          left: 0
        };
      }

      // flag comment if resolved
      var resolvedClass = '';
      if (commentObj.status == 1) {
        resolvedClass = 'resolved';
      }

      // check for child comments
      var childClasses = '';
      if (commentObj.parent != 0) {
        childClasses = 'nested-child child-of-' + commentObj.parent;
      }

      // create sidebar comment html
      commentObj.html = Drupal.theme('dynamicCommentsCommentObjHTML', commentObj, childClasses, resolvedClass);

      // create icon html
      commentObj.icon = Drupal.theme('dynamicCommentsCommentObjIcon', commentObj);

      // method for the comment to print itself in the UI
      commentObj.print = function() {
        // attempt to stop creation of multiple cloned objects
        // @TODO: does this work? is it needed?
        if (!document.getElementById(commentObj.cid)) {
          if (commentObj.parent == 0) {
            $('#dynamic-comments-sidebar .dynamic-comments-sidebar-inner').prepend(commentObj.html);
            $('.dynamic-comments-icons').prepend(commentObj.icon);
          }
          else {
            $('#dynamic-comments-sidebar .dynamic-comments-sidebar-inner .comment-' + commentObj.parent).after(commentObj.html);
          }


        }
        else {
        // @TODO: this is screwing up the objects after they are first created on load!!!
        //commentObj = null;
        }
      }

      commentObj.erase = function() {
        $('.comment-' + commentObj.cid).remove();
        $('.dynamic-comments-comment-icon#' + commentObj.cid).remove();
      }
      commentObj.update = function() {
        $('.comment-' + commentObj.cid).replaceWith(commentObj.html);
      }
      return commentObj;

    },

    // internal function to this object, used in the create method above
    // @TODO: figure out how to make this private, so it's not hit directly
    getPosition : function(selection) {
      var position;

      Drupal.behaviors.dynamic_comments.cssApplier = rangy.createCssClassApplier('c', {
        normalize: true
      });

      Drupal.behaviors.dynamic_comments.currentSelection = selection;
      Drupal.behaviors.dynamic_comments.cssApplier.applyToSelection();

      position = $('.c').position();

      Drupal.behaviors.dynamic_comments.cssApplier.undoToSelection();
      Drupal.behaviors.dynamic_comments.currentSelection = null;

      return position;
    }
  }
})(jQuery);
