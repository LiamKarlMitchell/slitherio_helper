slitherio_helper

A project to help with co-op in slitherio.
As well as some other playing around/learning.

Can run a node.js server to act as the echo websocket server, and can auto connect to a prefered ip and port if known.

The websocket server will receive updates and send them out to other connected clients.
Their positions can be rendered on an overlay, which can be scaled using mouse wheel.

Snakes and food and prey are also rendered.
Although I have not put this over the websocket nicely yet due to a lack of way to know how to not update/overwrite games latest info... And it would chew up more data.

![Screenshot](https://i.imgur.com/P6Vq8he.png)

![Screenshot](https://i.imgur.com/mafk6rC.jpg)