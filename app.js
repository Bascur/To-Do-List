//Require Modules

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

//Set express
const app = express();

//Set the views folder
app.set('view engine', 'ejs');

//Parse the body
app.use(express.urlencoded({ extended: true }));

//Access to static files
app.use(express.static("public"));

//Connect to DB
mongoose.connect("mongodblink", { useNewUrlParser: true });

//Create the Schema for the /
const itemsSchema = {
    name: String
};

//Create the model (table) based on that Schema
const Item = mongoose.model("Item", itemsSchema);


//Default list items
const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Schema for custom lists
const listSchema = {
    name: String,
    items: [itemsSchema]
};

//Create the model (table) based on the list schema
const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {

        //Check if theres no items in order to render the default ones
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully savevd default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });

});

// Custom list maker
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show an existing list

                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });



});

//Post to add new items
app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

//Post to delete items
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }


});

app.get("/about", function(req, res) {
    res.render("about");
});

//Server up

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function() {
    console.log("Server started on port 3000");
});