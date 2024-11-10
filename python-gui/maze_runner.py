import tkinter as tk
from tkinter import messagebox
import random
from dataclasses import dataclass
import time

@dataclass
class Position:
    x: int
    y: int

class MazeCell:
    def __init__(self):
        self.is_wall = True
        self.visited = False

class MazeGame:
    def __init__(self, size=15, time_limit=120):
        self.size = size
        self.time_limit = time_limit
        self.time_remaining = time_limit
        self.maze = [[MazeCell() for _ in range(size)] for _ in range(size)]
        self.player_pos = Position(size // 2, size // 2)
        self.exit_pos = None
        self.is_game_active = False
        self.last_update = time.time()

        # Create main window
        self.root = tk.Tk()
        self.root.title("Maze Runner")

        # Create game frame
        self.game_frame = tk.Frame(self.root)
        self.game_frame.pack(padx=10, pady=10)

        # Create timer label
        self.timer_label = tk.Label(
            self.root,
            text=f"Time: {self.time_remaining}s",
            font=("Arial", 16)
        )
        self.timer_label.pack(pady=5)

        # Create canvas for maze
        cell_size = 30
        canvas_size = size * cell_size
        self.cell_size = cell_size
        self.canvas = tk.Canvas(
            self.game_frame,
            width=canvas_size,
            height=canvas_size,
            bg='white'
        )
        self.canvas.pack()

        # Create control buttons
        self.create_controls()

        # Bind keyboard events
        self.root.bind('<Left>', lambda e: self.move('left'))
        self.root.bind('<Right>', lambda e: self.move('right'))
        self.root.bind('<Up>', lambda e: self.move('up'))
        self.root.bind('<Down>', lambda e: self.move('down'))

        # Start new game
        self.start_new_game()

    def create_controls(self):
        """Create control buttons for the game"""
        control_frame = tk.Frame(self.root)
        control_frame.pack(pady=10)

        # Movement buttons
        tk.Button(control_frame, text="↑", command=lambda: self.move('up')).grid(row=0, column=1)
        tk.Button(control_frame, text="←", command=lambda: self.move('left')).grid(row=1, column=0)
        tk.Button(control_frame, text="→", command=lambda: self.move('right')).grid(row=1, column=2)
        tk.Button(control_frame, text="↓", command=lambda: self.move('down')).grid(row=2, column=1)

        # New game button
        tk.Button(
            self.root,
            text="New Game",
            command=self.start_new_game
        ).pack(pady=5)

    def generate_maze(self):
        """Generate maze using recursive backtracking"""
        def carve_path(x, y):
            self.maze[y][x].visited = True
            self.maze[y][x].is_wall = False

            # Define possible directions: up, right, down, left
            directions = [(0, -2), (2, 0), (0, 2), (-2, 0)]
            random.shuffle(directions)

            for dx, dy in directions:
                new_x, new_y = x + dx, y + dy
                if (0 <= new_x < self.size and
                    0 <= new_y < self.size and
                    not self.maze[new_y][new_x].visited):
                    # Carve path by making cells between current and new position empty
                    self.maze[y + dy//2][x + dx//2].is_wall = False
                    carve_path(new_x, new_y)

        # Initialize maze
        for row in self.maze:
            for cell in row:
                cell.is_wall = True
                cell.visited = False

        # Generate maze from center
        start_x = start_y = self.size // 2
        carve_path(start_x, start_y)

        # Create exit
        exit_sides = [
            (0, 1),                    # Top
            (self.size-1, self.size-2),# Right
            (self.size-2, self.size-1),# Bottom
            (1, 0)                     # Left
        ]
        self.exit_pos = Position(*random.choice(exit_sides))
        self.maze[self.exit_pos.y][self.exit_pos.x].is_wall = False

    def draw_maze(self):
        """Draw the maze on the canvas"""
        self.canvas.delete("all")

        for y in range(self.size):
            for x in range(self.size):
                x1 = x * self.cell_size
                y1 = y * self.cell_size
                x2 = x1 + self.cell_size
                y2 = y1 + self.cell_size

                # Draw cell
                if self.maze[y][x].is_wall:
                    self.canvas.create_rectangle(x1, y1, x2, y2, fill='gray', outline='white')

                # Draw player
                if x == self.player_pos.x and y == self.player_pos.y:
                    self.canvas.create_oval(
                        x1+4, y1+4, x2-4, y2-4,
                        fill='red',
                        outline='darkred'
                    )

                # Draw exit
                if x == self.exit_pos.x and y == self.exit_pos.y:
                    self.canvas.create_rectangle(
                        x1, y1, x2, y2,
                        fill='green',
                        outline='darkgreen'
                    )

    def move(self, direction):
        """Handle player movement"""
        if not self.is_game_active:
            return

        dx, dy = {
            'left': (-1, 0),
            'right': (1, 0),
            'up': (0, -1),
            'down': (0, 1)
        }[direction]

        new_x = self.player_pos.x + dx
        new_y = self.player_pos.y + dy

        # Check if move is valid
        if (0 <= new_x < self.size and
            0 <= new_y < self.size and
            not self.maze[new_y][new_x].is_wall):
            self.player_pos.x = new_x
            self.player_pos.y = new_y
            self.draw_maze()

            # Check for win
            if (new_x == self.exit_pos.x and
                new_y == self.exit_pos.y):
                self.end_game(True)

    def update_timer(self):
        """Update game timer"""
        if self.is_game_active:
            current_time = time.time()
            elapsed = int(current_time - self.last_update)
            if elapsed >= 1:
                self.time_remaining -= elapsed
                self.last_update = current_time
                self.timer_label.config(text=f"Time: {self.time_remaining}s")

                if self.time_remaining <= 0:
                    self.end_game(False)
                    return

            self.root.after(100, self.update_timer)

    def end_game(self, won):
        """Handle game end"""
        self.is_game_active = False
        message = "You Won!" if won else "Time's Up!"
        messagebox.showinfo("Game Over", message)

    def start_new_game(self):
        """Initialize a new game"""
        self.time_remaining = self.time_limit
        self.last_update = time.time()
        self.player_pos = Position(self.size // 2, self.size // 2)
        self.generate_maze()
        self.draw_maze()
        self.is_game_active = True
        self.update_timer()

    def run(self):
        """Start the game loop"""
        self.root.mainloop()

if __name__ == "__main__":
    game = MazeGame(size=15, time_limit=120)
    game.run()
