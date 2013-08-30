/*
jQuery Plugin: Drunk game
Version: 1.0
Author: Pavel Koltyshev
Email: pkoltyshev@gmail.com
 */

(function (window, document, $) {
    "use strict";

    // Расставляет элементы исходного массива в случайном порядке
    function arrayShuffle(arr) {
        var temp,
            j, // Случайный индекс массива
            i, // Индекс массива от большего к меньшему
            len = arr.length;
        for (i = len - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            // Если индексы различны, меняем местами элементы массива
            if (i !== j) {
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    }


    // Реализует наследование и возвращает новую функцию-конструктор
    function extendType(Parent, constr, props) {
        // Новый конструктор
        var Child = function () {
            // Вызов родительской функции-конструктора
            Parent.apply(this, arguments);
            // Вызов дочернего конструктора
            if (constr) {
                constr.apply(this, arguments);
            }
        };
        // Наследование с промежуточным прототипом
        Parent = Parent || Object;
        var Func = function () {};
        Func.prototype = Parent.prototype;
        Child.prototype = new Func();
        Child.prototype.constructor = Child;
        // Копируем собственные свойства и методы в прототип
        var i;
        for (i in props) {
            if (props.hasOwnProperty(i)) {
                Child.prototype[i] = props[i];
            }
        }
        return Child;
    }


    // Объекты поддерживающие представления
    function Viewable() {
        this.view = null;
    }
    Viewable.prototype = {
        constructor: Viewable
    };


    // Базовое представление
    function View(obj) {
        this.obj = obj; // Объект для которого создается представление
        this.domNode = null; // DOM-объект в jQuery обертке
        this.parent = null; // Родительское представление
        this.children = []; // Дочерние представления
    }

    View.prototype = {
        constructor: View,

        // Разрывает связь с родительским видом
        tearRelation: function () {
            var that = this;
            if (that.parent) {
                that.parent.removeChild(that);
            }
        },

        // Добавляет дочерний вид
        addChild: function (view) {
            if (!view instanceof View) {
                throw new Error('Переданный объект не является представлением.');
            }
            var that = this;
            if ($.inArray(view, that.children) === -1) {
                view.tearRelation();
                view.parent = that;
                that.children.push(view);
                if (that.domNode && view.domNode) {
                    view.domNode.appendTo(this.domNode);
                }
            }
            return this;
        },

        // Удаляет дочерний вид
        removeChild: function (view) {
            if (!view instanceof View) {
                throw new Error('Переданный объект не является представлением.');
            }
            var that = this,
                len = that.children.length,
                i,
                value;
            for (i = 0; i < len; i += 1) {
                value = that.children[i];
                if (value === view) {
                    view.parent = null;
                    that.children.splice(i, 1);
                    break;
                }
            }
        },

        getWidth: function () {
            return this.domNode ? this.domNode.width() : 0;
        },

        getHeight: function () {
            return this.domNode ? this.domNode.height() : 0;
        },

        moveCenterByHorizontal: function (x) {
            x = x || 0;
            if (this.domNode && this.parent) {
                x += Math.floor((this.parent.getWidth() - this.getWidth()) / 2);
                this.moveLeft(x);
            }
            return this;
        },

        moveCenterByVertical: function (y) {
            y = y || 0;
            if (this.domNode && this.parent) {
                y += Math.floor((this.parent.getHeight() - this.getHeight()) / 2);
                this.moveTop(y);
            }
            return this;
        },

        moveCenter: function (x, y) {
            this.moveCenterByHorizontal(x);
            this.moveCenterByVertical(y);
            return this;
        },

        moveTop: function (top) {
            if (this.domNode) {
                top = top || 0;
                this.domNode.css({top: top + 'px', bottom: ''});
            }
            return this;
        },

        moveBottom: function (bottom) {
            if (this.domNode) {
                bottom = bottom || 0;
                this.domNode.css({bottom: bottom + 'px', top: ''});
            }
            return this;
        },

        moveLeft: function (left) {
            if (this.domNode) {
                left = left || 0;
                this.domNode.css({left: left + 'px', right: ''});
            }
            return this;
        },

        moveRight: function (right) {
            if (this.domNode) {
                right = right || 0;
                this.domNode.css({right: right + 'px', left: ''});
            }
            return this;
        },

        moveTopLeft: function (top, left) {
            return this.moveTop(top).moveLeft(left);
        },

        moveBottomRight: function (bottom, right) {
            return this.moveBottom(bottom).moveRight(right);
        },

        setOrder: function (order) {
            if (this.domNode) {
                this.domNode.css('z-index', order);
            }
            return this;
        },

        move: function (x, y) {
            this.moveLeft(x);
            this.moveTop(y);
            return this;
        },

        show: function () {
            this.domNode.show();
            return this;
        },

        hide: function () {
            this.domNode.hide();
            return this;
        },

        update: function () {}
    };

    // Создает перечисляемый тип из ассоциативного массива.
    // Перечисляемый тип содержит постоянный набор объектов.
    function createEnum(assocArray) {
        var values = [], // Приватный массив для хранения объектов.

        // Конструктор не будет создавать новые объекты,
        // он будет являться контейнером для набора объектов.
            Enum = function () {
                throw 'Нельзя создать экземпляр типа Enum.';
            },

        // Прототип для набора объектов.
            proto = {
                constructor: Enum,
                toString: function () { return this.name; },
                valueOf: function () { return this.value; },
                toJSON: function () { return this.name; }
            };

        // Enum - родитель для набора объектов.
        Enum.prototype = proto;

        // Создать набор объектов и положить в values.
        var p, obj;
        for (p in assocArray) {
            if (assocArray.hasOwnProperty(p)) {
                obj = Object.create(proto);
                obj.name = p;
                obj.value = assocArray[p];
                Enum[p] = obj;
                values.push(obj);
            }
        }

        // Добавить метод обхода набора объектов.
        Enum.foreach = function (fn) {
            var i, len;
            for (i = 0, len = values.length; i < len; i += 1) {
                fn(values[i]);
            }
        };

        return Enum;
    }

    // Перечисление мастей
    var CardSuits = createEnum({Clubs: 1, // трефы ♣
                            Diamonds: 2, // бубны ♦
                            Hearts: 3, // червы ♥
                            Spades: 4}); // пики ♠

    // Перечисление рангов
    var CardRanks = createEnum({Two: 2, Three: 3, Four: 4, Five: 5, Six: 6,
                            Seven: 7, Eight: 8, Nine: 9, Ten: 10,
                            Jack: 11, Queen: 12, King: 13, Ace: 14});


    // Представление карты
    var CardView = extendType(View, function () {
        var that = this,
            domNode =  $('<div></div>');
        domNode.addClass('drunk-game__card');
        domNode.append($('<div class="rank"></div>'));
        domNode.append($('<div class="suit"></div>'));
        domNode.append($('<div class="rank-bottom"></div>'));
        that.domNode = domNode;
        that.turnShirt();
        that.setRank(that.obj.rank);
        that.setSuit(that.obj.suit);
        that.intervalId = null;
    }, {
        getRankName: function (rank) {
            var rankName;
            switch (rank) {
            case CardRanks.Jack:
                rankName = 'В';
                break;
            case CardRanks.Queen:
                rankName = 'Д';
                break;
            case CardRanks.King:
                rankName = 'К';
                break;
            case CardRanks.Ace:
                rankName = 'Т';
                break;
            default:
                rankName = rank.value.toString();
                break;
            }
            return rankName;
        },

        onClickable: function (callable) {
            var that = this;
            that.domNode.addClass('drunk-game__card_clickable');
            if (callable) {
                that.domNode.one('click', callable);
            }
            return that;
        },

        offClickable: function () {
            var that = this;
            that.domNode.removeClass('drunk-game__card_clickable');
            return that;
        },

        onLight: function () {
            var that = this;
            if (that.intervalId) {
                window.clearInterval(that.intervalId);
            }
            that.intervalId = window.setInterval(function () {
                that.domNode.toggleClass('drunk-game__card_light');
            }, 500);
            return that;
        },

        offLight: function () {
            var that = this;
            if (that.intervalId) {
                window.clearInterval(that.intervalId);
            }
            that.domNode.removeClass('drunk-game__card_light');
            return that;
        },

        setRank: function (rank) {
            var that = this;
            that.domNode.find('.rank, .rank-bottom').text(that.getRankName(rank));
            return that;
        },

        setSuit: function (suit) {
            var cssClass,
                that = this;
            if (suit === CardSuits.Diamonds) {
                cssClass = 'drunk-game__card_suit_diamonds';
            } else if (suit === CardSuits.Hearts) {
                cssClass = 'drunk-game__card_suit_hearts';
            } else if (suit === CardSuits.Clubs) {
                cssClass = 'drunk-game__card_suit_clubs';
            } else if (suit === CardSuits.Spades) {
                cssClass = 'drunk-game__card_suit_spades';
            }

            if (cssClass) {
                that.domNode.addClass(cssClass);
            }

            return that;
        },

        // Переворачивает карту рубашкой вверх
        turnShirt: function () {
            var that = this;
            that.domNode.removeClass('drunk-game__card_side_front').addClass('drunk-game__card_side_shirt');
            return that;
        },

        // Переворачиваетк карту лицевой стороной вверх
        turnFront: function () {
            var that = this;
            that.domNode.removeClass('drunk-game__card_side_shirt').addClass('drunk-game__card_side_front');
            return that;
        }
    });


    // Игральная карта
    var Card = extendType(Viewable, function (suit, rank) {
        this.suit = suit; // Масть
        this.rank = rank; // Значение
        this.view = new CardView(this);
    }, {
        // Текстовое представление карты
        toString: function () {
            return this.rank.toString() + ' ' + this.suit.toString();
        },

        // Сравнивает значения двух карт
        compareTo: function (other) {
            var compare;
            if (this.rank < other.rank) {
                compare = -1;
            } else if (this.rank > other.rank) {
                compare = 1;
            } else {
                compare = 0;
            }
            return compare;
        }
    });

    // Представление колоды карт
    var DeckView = extendType(View, function () {
        this.domNode = $('<div></div>').addClass('drunk-game-deck');
    }, {
        // Выполняет обход представлений карт, вызывая для каждого представления функцию callback
        foreach: function (callback) {
            var that = this;
            $.each(that.children, function (index, cardView) {
                if (cardView instanceof CardView) {
                    callback(cardView);
                }
            });
        },

        // Переворачивает все карты рубашкой вверх у представлений карт
        turnShirt: function () {
            var that = this;
            that.foreach(function (cardView) {
                cardView.turnShirt();
            });
        },

        // Обновляет представление колоды карт
        update: function () {
            var that = this,
                order = this.obj.getNumber(),
                padd = 0;
            that.foreach(function (cardView) {
                cardView.setOrder(order).moveLeft(padd);
                padd += 6;
                order -= 1;
            });
        }
    });

    // Колода карт
    var Deck = extendType(Viewable, function () {
        this.cards = [];
        this.view = new DeckView(this);
    }, {
        // Заполняет колоду картами
        fillCards: function () {
            var that = this,
                card;
            CardSuits.foreach(function (suit) {
                CardRanks.foreach(function (rank) {
                    card = new Card(suit, rank);
                    that.cards.push(card);
                    that.view.addChild(card.view);
                });
            });
        },

        // Добавляет карту(ы) в начало колоды
        addCard: function (card) {
            var that = this;
            if ($.isArray(card)) {
                [].unshift.apply(that.cards, card);
                that.foreach(function (card) {
                    that.view.addChild(card.view);
                });
            } else {
                that.cards.unshift(card);
                that.view.addChild(card.view);
            }
            that.view.update();
        },

        // Добавляет карту в конец колоды
        addCardToBottom: function (card) {
            var that = this;
            if ($.isArray(card)) {
                [].push.apply(this.cards, card);
                that.foreach(function (card) {
                    that.view.addChild(card.view);
                });
            } else {
                this.cards.push(card);
                that.view.addChild(card.view);
            }
            that.view.update();
        },

        // Возвращает карту из начала колоды
        getCard: function (num) {
            var that = this,
                card,
                cards;
            num = num || 1;
            if (num === 1) {
                card = that.cards.shift();
                card.view.tearRelation();
                return card;
            }
            cards = that.cards.splice(0, num);
            $.each(cards, function (index, card) {
                card.view.tearRelation();
            });
            return cards;
        },

        // Возвращает все карты из колоды
        getAllCards: function () {
            var that = this,
                cards = that.cards.splice(0);
            $.each(cards, function (index, card) {
                card.view.tearRelation();
            });
            return cards;
        },

        // Возвращает количество карт в колоде
        getNumber: function () {
            return this.cards.length;
        },

        // Перемешивает колоду карт
        shuffle: function () {
            arrayShuffle(this.cards);
        },

        // Обход колоды карт
        foreach: function (callback) {
            $.each(this.cards, function (index, card) {
                callback(card);
            });
        }
    });

    // Представление игрока
    var PlayerView = extendType(View, function () {
        var domNode = $('<div></div>');
        domNode.addClass('drunk-game__player');
        domNode.append($('<span class="name">Игрок:<i class="name-value"></i></span>'));
        domNode.append($('<span class="score">Счет:<i class="score-value"></i></span>'));
        this.domNode = domNode;
        this.setName(this.obj.name);
        this.setScore(this.obj.score);
    }, {
        setName: function (name) {
            this.domNode.find('.name-value').text(name);
        },

        setScore: function (score) {
            this.domNode.find('.score-value').text(score);
        },

        update: function () {
            this.setScore(this.obj.score);
        }
    });

    // Игрок
    var Player = extendType(Viewable, function (name) {
        this.name = name;
        this.score = 0;
        this.deck = new Deck();
        this.view = new PlayerView(this);
    }, {
        // Строковое представление игрока
        toString: function () {
            return this.name + ': ' + this.deck.getNumber();
        }
    });


    // Представление игрового пространства
    var GameView = extendType(View, function () {

    }, {
        setDomNode: function (domNode) {
            this.domNode = domNode;
            this.domNode.addClass('drunk-game');
        }
    });

    // Игра
    var Game = extendType(Viewable, function (domNode) {
        this.view = new GameView(this);
        this.view.setDomNode(domNode);

        // Создаем колоду карт
        this.deck = new Deck();

        // Колода для временного хранения карт в случае ничьи
        this.tempDeck = new Deck();

        // Создаем карты и заполняем ими колоду
        this.deck.fillCards();

        // Создаем игроков
        this.playerPC = new Player(this.getRandomNameFromPlayerPC());
        this.playerMan = new Player('Пользователь');

        this.view.addChild(this.playerPC.view)
            .addChild(this.playerPC.deck.view)
            .addChild(this.playerMan.view)
            .addChild(this.playerMan.deck.view)
            .addChild(this.deck.view)
            .addChild(this.tempDeck.view);

        // Позиционирование представлений
        this.deck.view.moveCenter();
        this.tempDeck.view.moveLeft(20).moveCenterByVertical();
        this.playerPC.view.moveTopLeft();
        this.playerMan.view.moveBottomRight();
        this.playerPC.deck.view.moveTop(40).moveCenterByHorizontal();
        this.playerMan.deck.view.moveBottom(40).moveCenterByHorizontal();

    }, {
        // Имена игроков
        playerNames: ['Доктор Зло', 'Дарт Вейдер', 'Фантомас'],

        // Возвращает случайное имя для игрока PC
        getRandomNameFromPlayerPC: function () {
            arrayShuffle(this.playerNames);
            return this.playerNames[0];
        },

        // Раздает карты игрокам
        dealCards: function (num) {
            num = num || 52 / 2; // 26 карт
            this.playerPC.deck.addCard(this.deck.getCard(num));
            this.playerMan.deck.addCard(this.deck.getAllCards());
        },

        // Возвращает истину если игра закончена.
        // Игра считается законченной если у одного из игроков закончились карты
        isOver: function () {
            return this.playerPC.deck.getNumber() === 0 || this.playerMan.deck.getNumber() === 0;
        },

        // Запускает игру
        start: function (num) {
            var card,
                that = this;

            // Тасует колоду
            that.deck.shuffle();

            // Раздает игрокам карты
            that.dealCards(num);

            // Верхняя карта игрока Man
            card = that.playerMan.deck.cards[0];
            if (card) {
                card.view.onLight().onClickable(function () {
                    that.nextFight();
                });
            }
        },

        // Действия завершающие игру
        finish: function () {
            var that = this,
                pc = this.playerPC,
                man = this.playerMan,
                winner; // Победитель

            if (pc.deck.getNumber() > 0) {
                winner = pc;
            } else if (man.deck.getNumber() > 0) {
                winner = man;
            }

            // Возвращаем карты из колоды для временного хранения
            if (that.tempDeck.getNumber() > 0) {
                that.deck.addCard(that.tempDeck.getAllCards());
            }

            if (winner) {
                // Увеличиваем счет
                winner.score += 1;
                // Обновляем представление игрока
                winner.view.update();
                // Возвращаем карты игрока в колоду
                that.deck.addCard(winner.deck.getAllCards());
            }

            // Переворачиваем карты в колоде рубашкой вверх
            that.deck.view.turnShirt();

            window.setTimeout(function () {
                that.start();
            }, 1000);
        },

        // Запускает следующий бой
        nextFight: function () {
            // Проверяем нужно ли остановить игру
            if (this.isOver()) {
                this.finish();
                return;
            }

            var winnerFight, // Победитель боя
                that = this,
                pc = this.playerPC,
                man = this.playerMan,
                cardPC = pc.deck.getCard(), // Верхняя карта игрока PC
                cardMan = man.deck.getCard(), // Верхняя карта игрока Man
                compare = cardPC.compareTo(cardMan);

            // Переворачиваем карты лицевой стороной вверх
            cardPC.view.turnFront();
            cardMan.view.turnFront().offLight().offClickable();

            // Делаем паузу
            window.setTimeout(function () {
                //Добавляем карты игроков в колоду для временного хранения карт
                that.tempDeck.addCard([cardPC, cardMan]);
                // У игрока PC оказалась большая карта
                if (compare === 1) {
                    winnerFight = pc;
                // У игрока Man оказалась большая карта
                } else if (compare === -1) {
                    winnerFight = man;
                }

                // Отдаем победителю карты
                if (winnerFight) {
                    // Переворачиваем карты в колоде для временного хранения рубашкой вверх
                    that.tempDeck.view.turnShirt();
                    // Карты для победителя ложим в конец его колоды
                    winnerFight.deck.addCardToBottom(that.tempDeck.getAllCards());
                }

                // Обновляем представления колод у игроков
                pc.deck.view.update();
                man.deck.view.update();

                // Делаем паузу и запускаем следующий бой
                window.setTimeout(function () {
                    that.nextFight();
                }, 500);
            }, 1200);
        }
    });

    // Подключаем плагин для jQuery
    // $(selector).drunkGame();
    $.fn.extend({drunkGame: function (options) {
        var domNode = this,
            game;
        options = options || {autorun: true};
        game = new Game(domNode);
        if (options.autorun) {
            game.start();
        }
        return game;
    }});

})(window, window.document, jQuery);
