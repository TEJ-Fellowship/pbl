module.exports = {
  ensureUserId: function(context, events, done) {
    console.log('Available vars:', Object.keys(context.vars));
    console.log('user_id value:', context.vars.user_id);
    
    if (!context.vars.user_id) {
      console.error('user_id is undefined!');
      return done(new Error('user_id is undefined'));
    }
    
    // Ensure it's a number
    context.vars.user_id = parseInt(context.vars.user_id, 10);
    return done();
  }
};
