const mongoose = require('mongoose');

const dailyQuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    categoryOptions: [
      {
        key: String, // 'cost_of_living', 'jobs', 'water', etc.
        label: String,
        icon: String, // emoji or icon name for the UI
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyQuestion', dailyQuestionSchema);
