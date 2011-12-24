config.inits.push(function(){
	console.log(['== Last init (TBD!). Config:', config]);
});
config.inits.forEach(function(single){single();});
delete config.inits;
