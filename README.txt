
CONTENTS OF THIS FILE
---------------------


 * Introduction
 * Installation
 * Configuration
 * Usage
 * Caveats
 * Maintainers
 * Thanks



INTRODUCTION
------------


Current maintainer: Mariano Asselborn <marianoasselborn@gmail.com>
Release blog post: http://www.acquia.com/blog/custom-development-docsacquiacom

Dynamic Comments is being developed as the first step into a front-end
collaborative interface on Drupal. The module is used to flag portions of text
on any given node and make comments on the selection. The system saves your
comment and its position on the document and allows other users viewing the same
node to see your comments in almost real time.

A good use case for this module can be found in the above link
"Release blog post", where an explanation on its usage to improve Acquia's
Documentation workflow can be read.

Please note that, while fully functional, the concept is still a bit of an
experiment, and some hands on configuration is needed. A good attempt to
document the process from installation to usage can be found below, but I am
always open to suggestions to improve it.



INSTALLATION
------------


Before installing, there are some dependencies that will require some downloads
to be made to avoid troubleshooting headaches. Go ahead and download the
following files (please note that, even though links are included, I can't
guarantee these links will always be functional, so you may need to search a bit
on your search engine of choice):

Rangy           http://code.google.com/p/rangy/
ScrollTo        http://archive.plugins.jquery.com/project/ScrollTo
JQuery Update   http://drupal.org/project/jquery_update

Once downloaded, create a new directory under <your-docroot>/sites/all/ called
libraries. Under your newly created <your-docroot>/sites/all/libraries
directory, place your Rangy libraries under "rangy", and your ScrollTo libraries
under "jquery.scrollTo". The JQuery UI module has an install process of its own
and may require file to be placed under "libraries" too. For more details refer
to its documentation.

At the moment of this writing, necessary Rangy files are:

rangy-core.js
rangy-cssclassapplier.js
rangy-selectionsaverestore.js
rangy-serializer.js

For ScrollTo, you can include all files.

Once the above process has been performed, you may go ahead and enable the
module, assuming it's placed in the modules directory. If everything is ok, you
can carry on with the configuration. If the module isn't finding the appropriate
libraries, it will let you know with a warning message.



CONFIGURATION
------------


The configuration form of this module can be found at
<your-site>/admin/settings/dynamic_comments and contains all the necessary
sections for tweaks to be made. There are not other locations that require any
configuration, with the exception of permissions.

First thing you'll have to decide is what content types will allow users to
make review comments to its content. You may find that it could be useful to
create a separate content type and use it specifically for reviews, or you may
want reviewers to comment on existing content. Either way, it's your choice.

You can also tweak the autorefresh interval rate from this form. This tweak is
useful when you want to control how often the module perform automatic queries
to retrieve new comments. The rule is simple, shorter time equals more
responsive UI at the cost of more server hammering. Longer times equals a less
responsive UI where collaboration comments will take longer to show in other
users' screens, but with the advantage of going easy on your server. Again, this
tweak is up to you and your knowledge of how much your servers can take.

If you are running a custom theme the content section classes may be different
than the stock theme ones, and if this is the case you can tweak the class from
this form too. This is also useful if you want only a certain region of a node
to allow for comments. Throw your custom class in the Content Class field and
the module will target only your preference.

An interesting feature that may need some thought, is being able to restrict the
commenting system via a user reference. So, only referenced users in your node
will be able to review and comment the content. If your content type has a user
reference field dedicated to this purpose, or if you decide to add it, you can
throw the machine name of the user reference field under "Limit reviewers per
User Reference field".

Last, and very important, you will want to assign the right permissions to the
right roles on the site. Under <your-site>/admin/user/permissions find the
"dynamic_comments module" section, where a good array of permissions can be
found. As of this writing, the permissions and their purpose are:

"administer Dynamic Comments" -> Module administration. Only grant to admins.
"delete Dynamic Comments single comments" -> Shows a delete option on comments
for moderation.
"resolve Dynamic Comments comments" -> Allows turning comments into a resolved
state.
"use Dynamic Comments module" -> Allows the usage of the module. Allows for
comments.



USAGE
-----


Any node created off an allowed content type, for any user with the right
permissions (covered in the configuration section) will allow for comment to be
made. The UI is simple, go ahead and highlight any text under content. A pop-up
little comment window will show up on your mouse pointer location. Cool uh? Go
ahead and write a comment about the text you just highlighted. You comment is
now saved persistently and will show up on the right of the screen. Place more
comments; they should all show up. You may also reply to a comment on the right,
and your answer will be attached to the bottom of the original comment. If you
have the appropriate permissions, you may delete comments. Also, with the
appropriate permissions, you may flag these comments as resolved, to provide a
nice feedback to the original reporter. If you are collaborating with someone
else, comments made on another computer will show on your screen at the interval
rate that was covered during the configuration.



CAVEATS
-------


You may be tempted to implement changes to the node that's being reviewed, as
feedback is being shared. DO NOT. Dynamic Comments saves a long string
representing the position of each comment on the DOM. If you comment and then
modify the content, you'll get a JavaScript Rangy error, which makes sense,
because the position of the comment is not longer the same. That's why on the
configuration section I recommend the creation of a dedicated content type for
reviews. You can easily implement your own node reference system to link reviews
to their original nodes, but this is beyond the scope of this module. A nice use
case and explanation of the entire solution can be found on the "Release blog
post" link at the top of this document.

Also, worth to mention as a caveat, is that this module polls for changes. This
approach can be very resources expensive if you have many users using the system
concurrently. The future roadmap includes the idea of using Node.js to push
changes rather than continously polling, but due to (you guessed right) time and
having to actually work for a living this may not happen as soon as you may
expect.



MAINTAINERS
-----------

Do you think this could be improved? Would you like to help? Awesome. Drop me a
line on the issue queue and we can arrange it. Help is always welcomed.



THANKS
------

Time is a resource, and some time was put into this during working hours.
Acquia's policy to give back to the community allows me to dedicate gardening
time to the project several times a month. So, in a way, this is possible thanks
to Acquia. Big applause for them.
