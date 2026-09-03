vim.opt.number = true
vim.opt.relativenumber = false
vim.opt.numberwidth = 3
vim.opt.signcolumn = "yes:1"
vim.opt.cursorline = true
vim.opt.cursorlineopt = "line,number"
vim.opt.wrap = false
vim.opt.scrolloff = 5
vim.opt.sidescrolloff = 8
vim.opt.laststatus = 2
vim.opt.showmode = true
vim.opt.ruler = false
vim.opt.cmdheight = 1
vim.opt.autoindent = true
vim.opt.smartindent = false
vim.opt.cindent = false
vim.opt.expandtab = true
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.tabstop = 2
vim.opt.swapfile = false
vim.opt.undofile = false
vim.opt.termguicolors = true
vim.opt.statusline = " %f %m%=%y  %l:%c "

vim.cmd("filetype plugin on")
vim.cmd("syntax enable")

local highlights = {
  Normal = { fg = "#dedede", bg = "#0a0a0a" },
  CursorLine = { bg = "#1a1a1a" },
  LineNr = { fg = "#606060", bg = "#0a0a0a" },
  CursorLineNr = { fg = "#ffffff", bg = "#1a1a1a", bold = true },
  SignColumn = { fg = "#606060", bg = "#0a0a0a" },
  StatusLine = { fg = "#111111", bg = "#e8e8e8", bold = true },
  ModeMsg = { fg = "#d8d8d8", bg = "#0a0a0a", bold = true },
  EndOfBuffer = { fg = "#262626", bg = "#0a0a0a" },
  Comment = { fg = "#777777", italic = true },
  String = { fg = "#b8b8b8" },
  Number = { fg = "#f0f0f0" },
  Keyword = { fg = "#ffffff", bold = true },
  Statement = { fg = "#f2f2f2", bold = true },
  Type = { fg = "#c8c8c8" },
  Function = { fg = "#eeeeee" },
  Identifier = { fg = "#d8d8d8" },
  Delimiter = { fg = "#a8a8a8" },
}

for group, value in pairs(highlights) do
  vim.api.nvim_set_hl(0, group, value)
end
