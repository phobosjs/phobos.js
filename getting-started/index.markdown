---
title: Getting Started
layout: page
---
## Installation

Let's install Phobos.js: `npm install phobosjs`

## Bootstrapping

The first thing to do is to create some models. Let's create a `User` and `Task` models:

<script src="https://gist.github.com/mtimofiiv/757ac6a02f2420cc9911.js?file=schema.js"></script>

As you notice, these are normal Mongoose model objects, the only quirk is they're placed in a single object and returned from the exported function. This allows Phobos.js to initialize the database connection and model objects in an efficient manner, as well as inject them where required as a `DS` variable.

Now, let's create a scope file. [Scopes](/core-conepts#scopes) are essentially permission levels that are configurable and fine-grained, allowing you to control exactly what the current user is allowed to do (and what they are not).

<script src="https://gist.github.com/mtimofiiv/757ac6a02f2420cc9911.js?file=scope.js"></script>

The format here is the root object contains model names, which in turn hold the permissions for each level - `read`, `edit`, `create`, `delete`, corresponding to the normal CRUD operations of a RESTful API. The `searchableBy` field allows you to whitelist how a client application will be able to search the resource. Through the `owners` field, you can specify an ownership relation - this corresponds to the field name in the model.

That's it - the basic app is almost complete. But now, we should make some controllers and wrap it all in an entry point file for us to launch.

## Controllers

A controller allows you to define the actual resource that will be associated to your model. So, let's create one:

<script src="https://gist.github.com/mtimofiiv/757ac6a02f2420cc9911.js?file=user_controller.js"></script>

Here, we're creating an exported function closure that accepts `DS` as an argument. `DS` stands for "data store" - this is essentially the collection of models we created earlier. Using this object, we can directly access any of the collections in the database.

The `_mountedAt` property is the endpoint that will be used for this resource, and should correspond to the model name. For example, with the model `User`, the `_mountedAt` should be `users`, which is the plural lowercase version of the same noun. Phobos.js figures out these connections by using an inflection library. Two word model names would be converted to underscored versions (so `ContentElement` becomes `content_elements`).

Of course, a controller should be created for `Task` as well:

<script src="https://gist.github.com/mtimofiiv/757ac6a02f2420cc9911.js?file=task_controller.js"></script>

## Wrapping it all up

Now, we should include all the files and try launching our test app. Not a lot of code is needed to do this, so let's get to it:

<script src="https://gist.github.com/mtimofiiv/757ac6a02f2420cc9911.js?file=app.js"></script>

Notice we instantiated the `Phobos` object with a few properties - these should be self explanatory except perhaps `bearerTokenSignature`, which is the string used as the "secret" used to generate the bearer tokens. Make sure to keep these in a safe place!

__NOTE:__ in the example, we used environment variables to store the properties, but perhaps you may want to use a different method.

## That's it!

Run your `app.js` file via `node app.js` and your API is running! Simple, right?
