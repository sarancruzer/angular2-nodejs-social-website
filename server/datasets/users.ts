import {Document, model, Model, Schema} from 'mongoose';
import * as bcrypt from 'bcryptjs';
// const friends = require('mongoose-friends');
const UsersConnected = require('./connected-users');

interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  website: string;
  gender: string;
  image: string;
  cover: string;
  location: string;
  createdAt: string;
  bio: string;
  role: number;
  isConnected: boolean;
  following: any;
}

const follower = new Schema(
  {
    userId: {required: true, type: String},
    date: Date,
    statut: {type: String, enum: ['pending', 'requested', 'accepted']},
    image: String,
    username: String
  });

const schema = new Schema({
  email: {
    type: String,
    trim: true,
    required: 'Email address is required',

  },
  username: {
    type: String
  },
  password: {
    type: String,
    required: 'mot de passe Mongoose required'
  },
  website: String,
  gender: String,
  image: String,
  cover: String,
  location: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  bio: String,
  role: Number,
  mail: String,
  isConnected: Boolean,
  following: [follower]
});

/**
 *Get the list of friends of a specific user.
 * @param followingTable
 * @param {Number} numberOfFriends
 * @param {String} fullDataWanted If you want a lot of data of just picture and username
 * @param {Function} callback
 */
schema.methods.listOfFriends = (followingTable = [], numberOfFriends = 0, fullDataWanted = false, callback) => {
  const following = followingTable;
  const newTable = following.filter(elem => elem.statut === 'accepted').map(doc => doc.userId);
  const valueSeek = fullDataWanted ? {} : {image: 1, _id: 1, username: 1};
  schema.methods.find({_id: {$in: newTable}}).select(valueSeek).limit(numberOfFriends)
    .exec(function (err, waster) {
      waster.map(el => {
        el._doc.userId = el._id.toString();
        el._doc.statut = 'accepted';
        delete el._doc._id;
        return el;
      });
      callback(waster);
    });
};

/**
 * Get list of friend and sent notf to all friend list that are connected
 * @param {Users} userData
 * @param {} message
 * @param {} aliasSocketMessage
 * @param {any} socketSource
 * @returns {Promise<T>}
 */
schema.methods.getListOfFriendAndSentSocket = (userData, message, aliasSocketMessage, socketSource): Promise<any> => {
  return new Promise((resolve, rej) => {
    this.listOfFriends(userData.following, 0, false, waster => {
      const socketUser = waster.map(elem => elem.userId);
      let socketIds = [];
      // send uniquely if the user is connected
      UsersConnected.find({userId: {$in: socketUser}}).exec((err, userCo) => {
        if (!err) {
          userCo.forEach(userConected => {
            userConected.location.forEach(socketId => {
              if (socketSource.sockets.connected[socketId.socketId]) {
                console.log('send to friend==>', socketId.socketId);
                socketIds = [...socketIds, socketId.socketId];
                socketSource.sockets.connected[socketId.socketId].emit(aliasSocketMessage, message);
              }
            });
          });
          resolve(waster);
        } else {
          rej(err);
        }
      });
    });
  });
};

schema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return callback(err);
    }
    callback(null, isMatch);
  });
};

schema.methods.hashingFunction = (password, tempUserData, insertTempUser, callback) => {
  bcrypt.genSalt(8, function (err, salt) {
    bcrypt.hash(password, salt, function (err, hash) {
      return insertTempUser(hash, tempUserData, callback);
    });
  });
};

// Omit the password when returning a user
schema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    return ret;
  }
});

// schema.plugin(friends({pathName: 'friendManagement'}));

export default model<IUser>('User', schema);
