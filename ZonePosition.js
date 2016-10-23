'use strict';

Game.prototype.initZones = function () {
	this.player = {
		enerZone: new TileZone({
			game: this,
			name: 'EnerZone',
			x: 92,
			y: 377,
			up: false,
			horizontal: false,
			center: false,
			width: 259,
			spacing: 5,
			showAmount: true
		}),
		signiZones: [
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 190,
				y: 421,
				showPower: true
			}),
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 288,
				y: 421,
				showPower: true
			}),
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 386,
				y: 421,
				showPower: true
			}),
		],
		mainDeck: new StackZone({
			game: this,
			name: 'MainDeck',
			x: 471.5,
			y: 421,
			showAmount: true
		}),
		lrigDeck: new StackZone({
			game: this,
			name: 'LrigDeck',
			x: 544.5,
			y: 421,
			showAmount: true,
			checkable: true
		}),
		checkZone: new StackZone({
			game: this,
			name: 'CheckZone',
			x: 190,
			y: 519
		}),
		lrigZone: new StackZone({
			game: this,
			name: 'LrigZone',
			x: 288,
			y: 519,
			showAmount: true
		}),
		trashZone: new StackZone({
			game: this,
			name: 'TrashZone',
			x: 471.5,
			y: 519,
			showAmount: true,
			checkable: true
		}),
		lrigTrashZone: new StackZone({
			game: this,
			name: 'LrigTrashZone',
			x: 544.5,
			y: 519,
			showAmount: true,
			checkable: true
		}),
		lifeClothZone: new TileZone({
			game: this,
			name: 'LifeClothZone',
			x: 158.5,
			y: 604.5,
			up: false,
			horizontal: true,
			center: false,
			width: 357,
			spacing: -Card.HEIGHT*2/3,
			showAmount: true
		}),
		excludedZone: new StackZone({
			game: this,
			name: 'ExcludedZone',
			x: 617.5,
			y: 421
		}),
		handZone: new TileZone({
			game: this,
			name: 'HandZone',
			x: 576/2,
			y: 690,
			up: true,
			horizontal: true,
			center: true,
			width: 576,
			spacing: 8
		})
	};

	this.opponent = {
		enerZone: new TileZone({
			game: this,
			name: 'EnerZone',
			x: 576-92,
			y: 734-377,
			opposite: true,
			up: false,
			horizontal: false,
			center: false,
			width: 259,
			spacing: 5,
			showAmount: true
		}),
		signiZones: [
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 576-190,
				y: 734-421,
				showPower: true,
				opposite: true
			}),
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 576-288,
				y: 734-421,
				showPower: true,
				opposite: true
			}),
			new StackZone({
				game: this,
				name: 'SigniZone',
				x: 576-386,
				y: 734-421,
				showPower: true,
				opposite: true
			}),
		],
		mainDeck: new StackZone({
			game: this,
			name: 'MainDeck',
			x: 576-471.5,
			y: 734-421,
			showAmount: true,
			opposite: true
		}),
		lrigDeck: new StackZone({
			game: this,
			name: 'LrigDeck',
			x: 576-544.5,
			y: 734-421,
			showAmount: true,
			opposite: true
		}),
		lrigZone: new StackZone({
			game: this,
			name: 'LrigZone',
			x: 576-288,
			y: 734-519,
			showAmount: true,
			opposite: true
		}),
		checkZone: new StackZone({
			game: this,
			name: 'CheckZone',
			x: 576-190,
			y: 734-519,
			opposite: true
		}),
		trashZone: new StackZone({
			game: this,
			name: 'TrashZone',
			x: 576-471.5,
			y: 734-519,
			showAmount: true,
			opposite: true,
			checkable: true
		}),
		lrigTrashZone: new StackZone({
			game: this,
			name: 'LrigTrashZone',
			x: 576-544.5,
			y: 734-519,
			showAmount: true,
			opposite: true,
			checkable: true
		}),
		lifeClothZone: new TileZone({
			game: this,
			name: 'LifeClothZone',
			x: 576-158.5,
			y: 734-604.5,
			opposite: true,
			up: false,
			horizontal: true,
			center: false,
			width: 357,
			spacing: -Card.HEIGHT*2/3,
			showAmount: true
		}),
		excludedZone: new StackZone({
			game: this,
			name: 'ExcludedZone',
			x: 576-617.5,
			y: 734-421,
			opposite: true
		}),
		handZone: new TileZone({
			game: this,
			name: 'HandZone',
			x: 576-576/2,
			y: 734-690,
			opposite: true,
			up: true,
			horizontal: true,
			center: true,
			width: 576,
			spacing: 8
		})
	};
	this.buttonZone = new StackZone({
		game: this,
		name: 'ButtonZone',
		x: 386,
		y: 519,
		centerText: true
	});
};