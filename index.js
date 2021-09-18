const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const firebase = require("firebase");
const bodyParser = require("body-parser");
const multer = require("multer");
const firebaseConfig = require("./config");

firebase.initializeApp(firebaseConfig);

const upload = multer();
const port = process.env.PORT || 3001;
const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/files/index.html");
});

// read
app.get("/placements", function (req, res) {
  const loggedUserId = req.query.loggedUserId;
  if (loggedUserId) {
    const dbRef = firebase.app().database().ref("placements");
    dbRef
      .once("value")
      .then(function (resp) {
        const data = resp.val();
        const opportunities = [];
        for (var id in data) {
          opportunities.push({ id, ...data[id] });
        }
        res.send(opportunities);
      })
      .catch((error) => {
        res.send("Error");
      });
  }
});

//delete
app.get("/deletePlacements", (req, res) => {
  const child = req.query.node;
  const node = firebase.database().ref("placements").child(child);
  node.remove();
  const dbRef = firebase.app().database().ref("placements");
  dbRef
    .once("value")
    .then(function (resp) {
      const data = resp.val();
      const opportunities = [];
      for (var id in data) {
        opportunities.push({ id, ...data[id] });
      }
      res.send(opportunities);
    })
    .catch((error) => {
      res.send("Error");
    });
});

//update / put
app.get("/applyPlacements", (req, res) => {
  const loggedUserId = req.query.uid;
  const cName = req.query.cName;
  const profile = req.query.profile;
  const dbRef = firebase.database().ref("placements/" + req.query.pid);
  firebase
    .database()
    .ref("users/" + loggedUserId)
    .once("value")
    .then((resp) => {
      var data = resp.val();
      if (data) {
        var name = data.name;
        var mobile = data.mobile;
        var email = data.email;
        var resume = data.resume.uriResume;
        var description = data.desc;
        var stream = data.stream;
        var tenth = data.tenth;
        var twelve = data.twelve;
        var college = data.college;
        var projects = data.projects || null;
        dbRef
          .child("applicants/" + loggedUserId + "_" + name + "_" + mobile)
          .set(
            {
              name: name,
              mobile: mobile,
              resume: resume,
              email: email,
              description: description,
              stream: stream,
              tenth: tenth,
              twelve: twelve,
              college: college,
              projects: projects,
            },
            (err) => {
              if (err) {
                console.error(err);
                res.send(false);
              } else {
                fetch(
                  `https://manavar81101.pythonanywhere.com/?email=${email}&companyname=${cName}&profile=${profile}`
                );
                res.send(true);
              }
            }
          );
      }
    })
    .catch((err) => {
      console.error(err);
      res.send(false);
    });
});

//read
app.get("/applicants", (req, res) => {
  const pid = req.query.pid;
  const node = firebase
    .database()
    .ref("placements")
    .child(pid + "/applicants");
  node.once("value").then((resp) => {
    res.send(resp);
  });
});

// write
app.post("/newOppurtunity", (req, res) => {
  const dbRef = firebase.database().ref("placements");
  dbRef.push(req.body);
});

// read
app.get("/fetchProfile", (req, res) => {
  const uid = req.query.uid;
  const dbRef = firebase.database().ref("users");
  dbRef
    .child(uid)
    .once("value")
    .then((resp) => {
      res.send(resp.val());
    });
});

//put/update
app.post("/updateProfile", (req, res) => {
  const uid = req.body[0];
  const profile = req.body[1];
  const dbRef = firebase.database().ref("users");
  dbRef.child(uid).update(profile, (error) => {
    if (error) {
      res.send(false);
    } else {
      res.send(true);
    }
  });
});

//put/update
app.post("/updateResume", (req, res) => {
  const uid = req.body[0];
  const resume = req.body[1];
  const dbRef = firebase.database().ref("users");
  dbRef.child(uid).update(resume, (error) => {
    if (error) {
      res.send(false);
    } else {
      res.send(true);
    }
  });
});

// write/ update
app.post("/uploadFirebase", upload.single("file"), async (req, res) => {
  var file = req.file;
  let metadata = { contentType: file.mimetype, name: req.body.name };
  const storageRef = firebase
    .storage()
    .ref()
    .child(`${req.body.type}/` + req.body.name);
  const resp = storageRef.put(file.buffer, metadata);
  resp.on(firebase.storage.TaskEvent.STATE_CHANGED, null, null, () => {
    storageRef.getDownloadURL().then((downloadUrl) => {
      res.send(downloadUrl);
    });
  });
});

// create
app.post("/signup", (req, res) => {
  const uinfo = req.body;
  const name = uinfo.name;
  const password = uinfo.password;
  const mobile = uinfo.mobile;
  const email = uinfo.email;

  var uid = "";
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((user) => {
      try {
        uid = user.user.uid;
        const usersDbRef = firebase.database().ref("users/");
        usersDbRef.child(uid).set(
          {
            uid,
            email,
            mobile,
            name,
          },
          (error) => {
            if (error) {
              res.send("Error");
            } else {
              try {
                res.send({ result: "Success", uid: uid });
              } catch {
                res.send("Error");
              }
            }
          }
        );
      } catch (e) {
        res.send("Error");
      }
    })
    .catch((err) => {
      res.send("Err");
    });
});

//get
app.post("/login", (req, res) => {
  try {
    var uinfo = req.body;
    const email = uinfo.email;
    const password = uinfo.password;
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(async (user) => {
        try {
          const userId = user.user.uid;
          res.send({ result: "success", uid: userId });
        } catch {
          res.send("Error");
        }
      })
      .catch((error) => {
        res.send(error);
      });
  } catch (err) {
    res.send("Internal Error");
  }
});

//get
app.get("/forgot-password", (req, res) => {
  const email = req.query.email;
  firebase
    .auth()
    .sendPasswordResetEmail(email)
    .then(function () {
      res.send("Success");
    })
    .catch(function (error) {
      res.send("Error");
    });
});

//get
app.get("/checkApplied", async (req, res) => {
  var flag = "NotApplied";
  const loggedUserId = req.query.loggedUserId; //user id
  const pid = req.query.pid; //opp id
  const dbRef = firebase.database().ref("placements/");
  await dbRef
    .child(pid)
    .once("value")
    .then((resp) => {
      var data = resp.val();
      if (data) {
        if (data.applicants) {
          for (const id of Object.keys(data.applicants)) {
            if (id.includes(loggedUserId)) {
              flag = "Applied";
              break;
            }
          }
        } else {
          flag = "NoApplicants";
        }
      }
    });
  if (flag === "Applied") {
    res.send({ flag });
  } else if (flag === "NotApplied" || flag === "NoApplicants") {
    firebase
      .database()
      .ref("users/")
      .child(loggedUserId)
      .once("value")
      .then((resp) => {
        var data = resp.val();
        if (data) {
          var sendData = { flag, ...data };
          res.send(sendData);
        }
      });
  }
});

app.listen(port, function () {
  console.log("server started at port", port);
});
