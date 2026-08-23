import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: document will expire when current date reaches expiresAt
    },
  },
  {
    timestamps: true,
  }
);

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

export default BlacklistedToken;
