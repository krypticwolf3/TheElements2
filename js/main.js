window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    
    EnemyTank = function (index, game, player, bullets) {

        var x = game.world.randomX;
        var y = game.world.randomY;

        this.game = game;
        this.player = player;
        this.alive = true;

        this.tank = game.add.sprite(x, y, 'enemy', 'tank1');

        this.tank.anchor.set(0.5);

        this.tank.name = index.toString();
        game.physics.enable(this.tank, Phaser.Physics.ARCADE);
        this.tank.body.immovable = false;
        this.tank.body.collideWorldBounds = true;
        this.tank.body.bounce.setTo(1, 1);

        this.tank.angle = game.rnd.angle();

        game.physics.arcade.velocityFromRotation(this.tank.rotation, 100, this.tank.body.velocity);

    };

    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });

    function preload () {

        game.load.atlas('tank', 'assets/tanks/tanks.png', 'assets/tanks/tanks.json');
        game.load.atlas('enemy', 'assets/tanks/enemy-tanks.png', 'assets/tanks/tanks.json');
        game.load.image('logo', 'assets/tanks/logo.png');
        game.load.image('earth', 'assets/tanks/scorched_earth.png');
        game.load.spritesheet('kaboom', 'assets/tanks/explosion.png', 64, 64, 23);
    }

    var land;

    var tank;

    var enemies;
    var enemiesTotal = 0;
    var enemiesAlive = 0;
    var explosions;

    var logo;

    var currentSpeed = 0;
    var cursors;

    function create () {

        //  Resize our game world to be a 2000 x 2000 square
        game.world.setBounds(-1000, -1000, 2000, 2000);

        //  Our tiled scrolling background
        land = game.add.tileSprite(0, 0, 800, 600, 'earth');
        land.fixedToCamera = true;

        //  The base of our tank
        tank = game.add.sprite(0, 0, 'tank', 'tank1');
        tank.anchor.setTo(0.5, 0.5);
        tank.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);

        //  This will force it to decelerate and limit its speed
        game.physics.enable(tank, Phaser.Physics.ARCADE);
        tank.body.drag.set(0.2);
        tank.body.maxVelocity.setTo(400, 400);
        tank.body.collideWorldBounds = true;

        //  The enemies bullet group
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    
        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 0.5);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);

        //  Create some baddies to waste :)
        enemies = [];

        enemiesTotal = 20;
        enemiesAlive = 20;

        for (var i = 0; i < enemiesTotal; i++)
        {
            enemies.push(new EnemyTank(i, game, tank, enemyBullets));
        }

        //  Explosion pool
        explosions = game.add.group();

        for (var i = 0; i < 10; i++)
        {
            var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
            explosionAnimation.anchor.setTo(0.5, 0.5);
            explosionAnimation.animations.add('kaboom');
        }

        tank.bringToTop();

        logo = game.add.sprite(0, 200, 'logo');
        logo.fixedToCamera = true;

        game.input.onDown.add(removeLogo, this);

        game.camera.follow(tank);
        game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
        game.camera.focusOnXY(0, 0);

        cursors = game.input.keyboard.createCursorKeys();

    }

    function removeLogo () {

        game.input.onDown.remove(removeLogo, this);
        logo.kill();

    }

    function update () {

        game.physics.arcade.overlap(enemyBullets, tank, bulletHitPlayer, null, this);

        enemiesAlive = 0;

        for (var i = 0; i < enemies.length; i++)
        {
            if (enemies[i].alive)
            {
                enemiesAlive++;
                game.physics.arcade.collide(tank, enemies[i].tank);
                game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this);
                enemies[i].update();
            }
        }

        if (cursors.left.isDown)
        {
            tank.angle -= 4;
        }
        else if (cursors.right.isDown)
        {
            tank.angle += 4;
        }

        if (cursors.up.isDown)
        {
            //  The speed we'll travel at
            currentSpeed = 300;
        }
        else
        {
            if (currentSpeed > 0)
            {
                currentSpeed -= 4;
            }
        }

        if (currentSpeed > 0)
        {
            game.physics.arcade.velocityFromRotation(tank.rotation, currentSpeed, tank.body.velocity);
        }

        land.tilePosition.x = -game.camera.x;
        land.tilePosition.y = -game.camera.y;

        //  Position all the parts and align rotations
        shadow.x = tank.x;
        shadow.y = tank.y;
        shadow.rotation = tank.rotation;

        turret.x = tank.x;
        turret.y = tank.y;

        turret.rotation = game.physics.arcade.angleToPointer(turret);

        if (game.input.activePointer.isDown)
        {
            //  Boom!
            fire();
        }

    }

    function PlayerBumpElement (tank, element) {

        element.kill();
        var explosionAnimation = explosions.getFirstExists(false);
            explosionAnimation.reset(tank.x, tank.y);
            explosionAnimation.play('kaboom', 30, false, true);
    }

    function render () {

        // game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.length, 32, 32);
        game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 32);

    }


};