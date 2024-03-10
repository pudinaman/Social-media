const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken"); // Fix the import statement
const sendEmail = require("../utils/sendEmail"); // Make sure to import the sendEmail function
const crypto =require("crypto");

// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id:"Sample",
      url: "Sample_url",
    },
  });

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});
// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    // creating token hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(
        new ErrorHandler(
          "Reset Password Token is invalid or has been expired",
          400
        )
      );
    }
  
    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password does not password", 400));
    }
  
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
  
    sendToken(user, 200, res);
  });

//get USer detail

exports.getUserDetail = catchAsyncErrors(async(req,res,next)=>{

    const user =await User.findById(req.user.id);

    res.status(200).json({
      success:true,
      user,
    });
  });

//Update User password

  exports.UpdateUserPassword = catchAsyncErrors(async(req,res,next)=>{

    const user =await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old passwword is incorrect", 401));
  }
  
  if(req.body.newPassword !==req.body.confirmPassword){
    return next(new ErrorHandler("password does not match",400));
  }

  user .password =req.body.newPassword
  await user.save();

  sendToken(user,200,res);
  });

//Update User profile

exports.UpdateUserProfile = catchAsyncErrors(async(req,res,next)=>{

 const newUserData={
  name:req.body.name,
  email:req.body.email,
 }
 
 const user =await User.findByIdAndUpdate(req.user.id, newUserData,{
  new:true,
  runValidators:true,
  useFindAndModify:false,
 });
res.status(200).json({
  success:true
});
});

//get all users (admin)
exports.getAllUser=catchAsyncErrors(async(req,res,next)=>{
  const users=await User.find();

  res.status(200).json({
    success:true,
    users,
  });
});

//get single user (admin)
exports.getSingleUser=catchAsyncErrors(async(req,res,next)=>{
  const user=await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`User does not exist with Id:${req.params.id}`))
  };

  res.status(200).json({
    success:true,
    user,
  });
});

//update user role

exports.UpdateUserRole = catchAsyncErrors(async(req,res,next)=>{

  const newUserData={
   name:req.body.name,
   email:req.body.email,
   role:req.body.role,
  }
  
  const user =await User.findByIdAndUpdate(req.params.id, newUserData,{
   new:true,
   runValidators:true,
   useFindAndModify:false,
  });
 res.status(200).json({
   success:true
 });
 });

 //delete user --Admin

 exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not exist with Id: ${req.params.id}`));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true
  });
});
// Follow a user
exports.followUser = catchAsyncErrors(async (req, res, next) => {
  const userToFollowId = req.params.userId;

  // Check if the user exists
  const userToFollow = await User.findById(userToFollowId);
  if (!userToFollow) {
    return next(new ErrorHandler('User to follow not found', 404));
  }

  // Add the user to follow in the 'following' list of the current user
  req.user.following.addToSet(userToFollowId);
  await req.user.save();

  // Add the current user in the 'followers' list of the user to follow
  userToFollow.followers.addToSet(req.user._id);
  await userToFollow.save();

  res.status(200).json({
    success: true,
    message: `You are now following ${userToFollow.username}`
  });
});

// Unfollow a user
exports.unfollowUser = catchAsyncErrors(async (req, res, next) => {
  const userToUnfollowId = req.params.userId;

  // Remove the user to unfollow from the 'following' list of the current user
  req.user.following.pull(userToUnfollowId);
  await req.user.save();

  // Remove the current user from the 'followers' list of the user to unfollow
  const userToUnfollow = await User.findById(userToUnfollowId);
  if (!userToUnfollow) {
    return next(new ErrorHandler('User to unfollow not found', 404));
  }
  userToUnfollow.followers.pull(req.user._id);
  await userToUnfollow.save();

  res.status(200).json({
    success: true,
    message: `You have unfollowed ${userToUnfollow.username}`
  });
});


 
 