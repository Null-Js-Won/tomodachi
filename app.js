const express = require("express"),
  { Client } = require("pg"),
  passport = require("passport"),
  FacebookTokenStrategy = require("passport-facebook-token"),
  cors = require("cors"),
  cookieParser = require("cookie-parser"),
  bodyParser = require("body-parser");

const config = require("./configuration/config"),
  { generateToken, sendToken } = require("./configuration/token");

const app = express(),
  corsOption = {
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    exposedHeaders: ["x-auth-token"]
  };

//Define Postgres parameters
let connectionString = "postgresql://localhost/arms";
const client = new Client({
  connectionString: connectionString
});
client.connect();

// Use the FacebookStrategy within Passport.
passport.use(
  new FacebookTokenStrategy(
    {
      clientID: config.facebook_api_key,
      clientSecret: config.facebook_api_secret
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        //Check whether the User exists or not using profile.id
        if (config.use_database) {
          // if sets to true
          client.query(
            "SELECT * from users where user_id=" + profile.id,
            (err, rows) => {
              if (err) throw err;
              if (rows && rows.rowCount === 0) {
                console.log("There is no such user, adding now");
                client.query(
                  "INSERT into users(user_id,user_name) VALUES('" +
                    profile.id +
                    "','" +
                    profile.displayName +
                    "')"
                );
              } else {
                console.log("User already exists in database");
              }
            }
          );
        }
        return done(null, profile);
      });
    }
  )
);

app.use(cors(corsOption));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function(req, res) {
  res.render("index", { user: req.user });
});

app.post(
  "/auth/facebook",
  passport.authenticate("facebook-token", { session: false }),
  function(req, res, next) {
    if (!req.user) {
      return res.send(401, "User Not Authenticated");
    }
    req.auth = {
      id: req.user.id
    };
    next();
  },
  generateToken,
  sendToken
);

app.get("/contacts/get/:id", (req, res) => {
  client.query(
    "SELECT * from contacts where user_id=" + req.params.user_id,
    (err, rows) => {
      if (err) throw err;
      if (rows && rows.rowCount === 0) {
        return res.json({
          data: rows
        });
      } else {
        return res.json({
          data: "No content"
        });
      }
    }
  );
});

app.post("/api/contacts/add", (req, res) => {
  client.query("SELECT * from contacts", (err, rows) => {
    if (err) throw err;
    client.query(
      "INSERT into users(user_id,firstName, lastName, email, phone) VALUES('" +
        req.params.user_id +
        "','" +
        req.params.firstName +
        "','" +
        req.params.lastName +
        "','" +
        req.params.email +
        "','" +
        req.params.phone +
        "')"
    );
    return res.json({
      data: "Field Added"
    });
  });
});

app.delete("/api/contacts/delete/:id", (req, res) => {
  client.query("SELECT * from contacts", (err, rows) => {
    if (err) throw err;
    client.query(
      "DELETE FROM contacts WHERE user_id=" +
        req.params.user_id +
        " AND id=" +
        req.params.id
    );
    return res.json({
      data: "Field Deleted"
    });
  });
});

app.get("/api/contacts/edit/:id", (req, res) => {
  client.query("SELECT * from contacts", (err, rows) => {
    if (err) throw err;
    client.query(
      "SELECT * FROM contacts WHERE user_id=" +
        req.params.user_id +
        " AND id=" +
        req.params.id
    );
    return res.json({
      data: "Field Deleted"
    });
  });
});

app.put("/api/contacts/update/:id", (req, res) => {
  client.query("SELECT * from contacts", (err, rows) => {
    if (err) throw err;
    client.query(
      "UPDATE contacts SET firstName=" +
        req.params.firstName +
        ", lastName=" +
        req.params.lastName +
        ", email=" +
        req.params.email +
        ", phone=" +
        req.params.phone +
        " WHERE user_id=" +
        req.params.user_id +
        " AND id=" +
        req.params.id
    );
    return res.json({
      data: "Field Updated"
    });
  });
});

// app.get("/account", ensureAuthenticated, function(req, res) {
//   res.render("account", { user: req.user });
// });

// app.get("/logout", function(req, res) {
//   req.logout();
//   res.redirect("/");
// });

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect("/login");
// }

app.listen(4000);