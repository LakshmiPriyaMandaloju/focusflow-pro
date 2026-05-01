const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const roomId = uuidv4().slice(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      name,
      createdBy: req.user.id,
      members: [{
        userId: req.user.id,
        name: req.user.name,
        isStudying: false
      }]
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const alreadyMember = room.members.find(
      m => m.userId.toString() === req.user.id
    );

    if (!alreadyMember) {
      room.members.push({
        userId: req.user.id,
        name: req.user.name,
        isStudying: false
      });
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('members.userId', 'name xp level');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const User = require('../models/User');
    const leaderboard = await User.find()
      .select('name xp level streak badges')
      .sort({ xp: -1 })
      .limit(20);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};