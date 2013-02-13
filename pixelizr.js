/*
* Author: Danny Calleri
* 
* MIT LICENSE
* 
* Originally created in 2010, published 2013
* All rights reserved.
*/


function Pixelizer(matrix)
{
	// ************************************************************************ 
	// PUBLIC METHODS 
	//
	// These are the only methods you should call inside your script
	// *********************************************************************** 
	this.pixelizeMatrix = pixelizeMatrix;
	this.putCharacterOnScreen = putCharacterOnScreen;
	this.putEnemyOnScreen = putEnemyOnScreen;
	// ************************************************************************ 


	// this has to be public in order
	// to be called by the onkeydown event handler,
	// but don't call this explicitly ^_^
	// don't call this at home! :D
	this.execMoveEnemy = execMoveEnemy;
	this.moveCharacter = moveCharacter;
	this.enemyAI = enemyAI;
	this.removeTargetFromArrays = removeTargetFromArrays;
	this.findNextTarget = findNextTarget;
	this.minInArray = minInArray;
	//this.colorToHex = colorToHex;
	
	var HERO = "#000000";
	var ENEMY = "#770000";
	var TARGET = "#993399";
	
	// Player data
	var row = 0,
		col = 0,
		prevRow = 0,
		prevCol = 0,
		heroAlive=new Boolean(false);
	
	// Enemy data
	var enemyRow=0,
		enemyCol=0,
		prevEnemyRow=0,
		prevEnemyCol=0,
		enemyAlive=new Boolean(false);
	
	var width = 0,
		height = 0;

	// total number of "pixels" of the
	// map
	var pixels = 0;
	
	var UP = 1,
		DOWN = 2,
		LEFT = 3,
		RIGHT = 4;

	var dirTempArray = [],
		dirTargetArray = [];

	var prevDirection = 0;

	// Arrays with all targets coordinates
	// I use those two arrays to access all the targets' positions
	// without searching for them on the matrix
	var rowTarget = [],
		colTarget = [];

	// did enemy reach the target?
	var enemyReachedTarget = new Boolean(true),
		nearestTargetRow = 0,
		nearestTargetCol = 12;
	
	var heroPoints = 0,
		enemyPoints = 0;


	// hack to make the object accessible
	// from the onkeydown event handler
	var pixelizr = this;
	this.enemyStarted = new Boolean(false);

	// filters input from keyboard
	window.onkeydown = function(e)
	{
		var key = e.keyCode;
		//		LEFT		RIGHT		UP			DOWN
		if(key == 37 || key == 39 || key == 38 || key == 40)
		{
			//alert("EHI");
			pixelizr.moveCharacter(key);
			
			// Enemy starting when the player starts
			if(pixelizr.enemyStarted == false)
			{
				pixelizr.execMoveEnemy();
				pixelizr.enemyStarted = new Boolean(true);
			}
		}
	}
	
	// Dim is the dimension of each pixel
	function pixelizeMatrix(dim)
	{
		height = matrix.length;
		width = matrix[0].length;
		
		for(var i=0; i < matrix.length; i++)
		{
			for(var j=0; j < matrix[i].length; j++)
			{
				var cell = document.createElement("div");
				
				if(j==0)
				{
					if(matrix[i][j]==0)
					{
						cell.setAttribute("style",
						"width: "+dim+"px; height: "+dim+"px; float: left; clear: left;");
					}
					else // this is a target block of the level
					{
						cell.setAttribute("style",
						"width: "+dim+"px; height: "+dim+"px; background-color: "+TARGET+"; float: left; clear: left;");
						pixels++; //this is a pixel!
						
						// updating the arrays that contain targets' coordinates
						rowTarget.push(i);
						colTarget.push(j);
					}
				}
				else
				{
					if(matrix[i][j]==0)
					{
						cell.setAttribute("style",
						"width: "+dim+"px; height: "+dim+"px; float: left;");
					}
					else // this is a target block of the level
					{
						
						cell.setAttribute("style",
						"width: "+dim+"px; height: "+dim+"px; background-color: "+TARGET+"; float: left;");
						pixels++; //this is a pixel!
						
						// updating the arrays that contain targets' coordinates
						rowTarget.push(i);
						colTarget.push(j);
					}
				}
				
				cell.setAttribute("id", i+","+j);
				
				
				document.getElementById("pixelizr").appendChild(cell);
			}
		}
		
		/*
			Instructions for aligning the game
			to the center of the page
		*/
		// calculating perfect width!
		var divWidth = (width * dim) ;
		document.getElementById("pixelizr").style.width = ""+divWidth+"px";
		document.getElementById("pixelizr").style.marginLeft = "auto";
		document.getElementById("pixelizr").style.marginRight = "auto";
		//
		
	}
	
	function putCharacterOnScreen(x, y)
	{
		// default values
		x = typeof x !== 'undefined' ? x : 0;
		y = typeof y !== 'undefined' ? y : 0;

		if(x < matrix.length && y < matrix[0].length)
		{
			row=x;
			col=y;
			prevRow = row;
			prevCol = col;

			document.getElementById(row+","+col).style.backgroundColor = HERO;
			
			heroAlive=new Boolean(true);
		}
		else
		{
			alert("[putCharacterOnScreen()] invalid coordinates");
		}
	}
	
	function putEnemyOnScreen(x, y)
	{
		// default values
		x = typeof x !== 'undefined' ? x : 0;
		y = typeof y !== 'undefined' ? y : 0;

		if(x < matrix.length && y < matrix[0].length)
		{
			enemyRow=x;
			enemyCol=y;
			prevEnemyRow=enemyRow;
			prevEnemyCol=enemyCol;

			document.getElementById(enemyRow+","+enemyCol).style.backgroundColor = ENEMY;
			
			enemyAlive=new Boolean(true);
		}
		else
		{
			alert("[putEnemyOnScreen()] invalid coordinates");
		}
	}
	
	function execMoveEnemy()
	{
		// workaround for setTimeout function
		var thisMoveEnemy=this;
		setTimeout( function () { thisMoveEnemy.enemyAI() } , 150 );
	}
	
	function colorToHex(c) 
	{
		var m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c);
		return m ? '#' + (1 << 24 | m[1] << 16 | m[2] << 8 | m[3]).toString(16).substr(1) : c;
	}
	
	// Enemy's AI logic
	function enemyAI()
	{	
		// Executes only if enemy is alive
		if(enemyAlive == true)
		{	
			var foundTarget=new Boolean(false);
			
			// Every time enemyAI is called we check all the directions
			// and find in which ones the enemy could move
			dirTempArray = [UP,DOWN,LEFT,RIGHT];
			// This array holds the directions with targets to destroy
			dirTargetArray = [];
			
			/*
				CONTROLLING THE BOUNDS FOR MOVING AND SEEKING POSSIBLE TARGETS
				For every possible direction it checks if it's possible to move
				the enemy on that one and checks if the pixels in those directions
				contain some targets
				
				NOTE: 
				Looping backward through the array because of the splicing.
			*/
			for(var i=dirTempArray.length-1; i >= 0; i--)
			{	
				if(dirTempArray[i] == UP)
				{
					// bounds check : checks if it's possible to move UP
					if((enemyRow-1) >= 0)
					{
						// controls if the UP pixel contains a target
						
						var value = colorToHex( document.getElementById((enemyRow-1)+","+enemyCol).style.backgroundColor );
						
						if(value == TARGET)
						{
							dirTargetArray.push(UP);
							foundTarget = new Boolean(true);
						}
						
					}
					else
						dirTempArray.splice(i,1);
				}
				else if(dirTempArray[i] == DOWN)
				{
					// bounds check : checks if it's possible to move DOWN
					if((enemyRow+1) <= (height-1)) 
					{
						var value = colorToHex( document.getElementById((enemyRow+1)+","+enemyCol).style.backgroundColor );
						
						if(value == TARGET)
						{
							dirTargetArray.push(DOWN);
							foundTarget = new Boolean(true);
						}
					}
					else
						dirTempArray.splice(i,1);
				}
				else if(dirTempArray[i] == LEFT)
				{
					if((enemyCol-1) >= 0) 
					{
						var value = colorToHex( document.getElementById((enemyRow)+","+(enemyCol-1)).style.backgroundColor );
						
						if(value == TARGET)
						{
							dirTargetArray.push(LEFT);
							foundTarget = new Boolean(true);
						}
					}
					else
						dirTempArray.splice(i,1);
				}
				else if(dirTempArray[i] == RIGHT)
				{	
					if((enemyCol+1) <= (width-1)) 
					{	
						var value = colorToHex( document.getElementById((enemyRow)+","+(enemyCol+1)).style.backgroundColor );
						
						if(value == TARGET)
						{
							dirTargetArray.push(RIGHT);
							foundTarget = new Boolean(true);
						}
					}
					else
						dirTempArray.splice(i,1);
					
				}
				
				//alert("loop number : " +i);
			}
			
			
			// Enemy AI found a target near to his position, move there and destroy it!
			if(foundTarget==true)
			{
				// Randomly eating a target! (Moving on it = eating it!)
				var randomIndex = Math.floor(Math.random() * dirTargetArray.length);
				var dirValue = dirTargetArray[randomIndex];
				
				// REMOVE
				prevDirection = dirValue; // remove it
				
				// moving on/eating target
				if(dirValue == UP) enemyRow--;
				else if(dirValue == DOWN) enemyRow++;
				else if(dirValue == LEFT) enemyCol--;
				else if(dirValue == RIGHT) enemyCol++;
				
				if((enemyRow == nearestTargetRow) && (enemyCol == nearestTargetCol))
					enemyReachedTarget = new Boolean(true);
				
				// A target was ate so i need to remove the coordinates from the targets' arrays
				this.removeTargetFromArrays(enemyRow, enemyCol);
				
				// Updating enemy's score
				enemyPoints++;
			}
			else if(foundTarget==false) // if the enemy hasn't found any near target, he needs to reach a new one
			{
				// the enemy find the nearest target and move on it ;)
				if(enemyReachedTarget == true)
				{
					// search and set the next nearest target
					this.findNextTarget();
					enemyReachedTarget = new Boolean(false);
				}
				
				if((enemyRow - nearestTargetRow) > 0) enemyRow--;
				else if((enemyRow - nearestTargetRow) < 0) enemyRow++;
				else if((enemyCol - nearestTargetCol) > 0) enemyCol--;
				else if((enemyCol - nearestTargetCol) < 0) enemyCol++;
			}
			
			
			// remove from previous position
			document.getElementById(prevEnemyRow+","+prevEnemyCol).style.backgroundColor = "transparent";
			
			// put enemy in new position!
			document.getElementById(enemyRow+","+enemyCol).style.backgroundColor = ENEMY;
			
			// this function has to recall itself!
			// resetting state
			this.foundTarget=new Boolean(false); // reset
			prevEnemyRow=enemyRow;
			prevEnemyCol=enemyCol;
			
			// If targets array is empty we have to stop the enemy and return!
			// The game ended!
			// DEBUG: Showing scores
			if(rowTarget.length==0)
			{
				enemyAlive=new Boolean(false);
				heroAlive=new Boolean(false);
				
				// DEBUG
				//alert("Your score : "+heroPoints+"\n"+"Enemy score : "+enemyPoints);
				// DEBUG
				
				return;
			}
			
			// recursion
			this.execMoveEnemy();
		}
	}
	
	// AI helper function
	function findNextTarget()
	{
		var distances = [];
		var tempDist = 0;
		
		// Calculate distances between enemy and targets
		for(var i=0; i < rowTarget.length; i++)
		{
			tempDist=Math.sqrt( Math.pow((enemyRow-rowTarget[i]),2) +  Math.pow((enemyCol-colTarget[i]),2) );
			distances.push(tempDist);
		}
		
		// find the nearest target to enemy
		var nearestIndex = this.minInArray(distances);
		
		nearestTargetRow = rowTarget[nearestIndex];
		nearestTargetCol = colTarget[nearestIndex];
	}
	
	// finds the minimum in the array "a"
	// and returns its index
	function minInArray(a)
	{
		var minIndex=0;
		for(var i=0; i < a.length; i++)
		{
			if(a[i] < a[minIndex])
				minIndex=i;
		}
		
		return minIndex;
	}
	
	// AI helper function
	function removeTargetFromArrays(row,col)
	{
		for(var i = rowTarget.length-1; i >= 0; i--)
		{
			if((rowTarget[i] == row) && (colTarget[i] == col))
			{
				rowTarget.splice(i,1);
				colTarget.splice(i,1);
			}
		}
	}
	
	// DEBUG
	/*
	function isDirInArray(dir)
	{
		var f = new Boolean(false);
		for(var i=0; i < dirTempArray.length; i++)
		{
			if(dir == dirTempArray[i])
				f = new Boolean(true);
		}
		
		return f;
	}
	*/
	
	function moveCharacter(key)
	{
		//alert("hero alive: "+heroAlive);
		
		if(heroAlive == true)
		{
			// updating character position
			if(key == 37) // LEFT
			{
				col--;
			}
			else if(key == 39) // RIGHT
			{
				col++;
			}
			else if(key == 38) // UP
			{
				row--;
			}
			else if(key == 40) // DOWN
			{
				row++;
			}

			// collisions with borders of matrix
			if(col < 0) col = 0;
			if(col >= width) col = width-1;
			if(row < 0) row = 0;
			if(row >= height) row = height-1;

			// removing the character from previous position
			document.getElementById(prevRow+","+prevCol).style.backgroundColor = "transparent";
			
			
			// Target ate by OUR HERO!!!
			// Update state!!!
			if(TARGET == colorToHex( document.getElementById(row+","+col).style.backgroundColor ))
			{
				this.removeTargetFromArrays(row, col);
				this.findNextTarget();

				// Our hero scores points!!!
				heroPoints++;
			}
			
			// new position!
			document.getElementById(row+","+col).style.backgroundColor = HERO;
			
			// Looking for more targets
			if(rowTarget.length==0)
			{
				enemyAlive=new Boolean(false);
				heroAlive=new Boolean(false);
				
				return;
			}

			prevRow=row;
			prevCol=col;
		}
	}
}