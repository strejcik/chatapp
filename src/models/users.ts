import mongoose , {Schema, Document} from "mongoose";
export interface IUser extends Document {
  email: string;
  password: string;
  conversation: Array<mongoose.Types.ObjectId>;
  friends: Array<mongoose.Types.ObjectId>
  createdAt: Date
}

const userSchema:Schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "/static/images/avatar/2.jpg"
    },
    name: {
      type: String,
      default: "o.o"
    },
    online: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: "@o.o"
    },
    password: {
      type: String,
      required: true,
    },
    bki: {
      type: Number,
      required: true
    },
    ikp: {
      prk: {
        type: Buffer,
        required: true,
      },
      pbk: {
        type: Buffer,
        required: true,
      }
    },
    pk: {
      ki: {
        type: Number,
        required: true
      },
      kp: {
        prk: {
          type: Buffer,
          required: true,
        },
        pbk: {
          type: Buffer,
          required: true,
        }
      }
    },
    spk: {
      ki: {
        type: Number,
        required: true
      },
      kp: {
        prk: {
          type: Buffer,
          required: true,
        },
        pbk: {
          type: Buffer,
          required: true,
        }
      },
      si: {
        type: Buffer,
        required: true,
      }
    },
    spki: {
      type: Number,
      required: true
    },
    conversation: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: []}],
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      default: [],
    }],
    createdAt: {type: Date, default: new Date().getTime()},
  },
);

export default mongoose.model<IUser>("User", userSchema);