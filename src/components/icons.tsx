// 图标别名层:业务组件只从这里取图标(不直接 import lucide-react),便于后续替换个别图标。
// 后续视图需要新图标时,在此处补 lucide 导入 + 别名。
import {
  Home, Radio, ListChecks, Lightbulb, Brain, LineChart, Settings, Search, Plus, Layers,
  CircleHelp, Check, X, ChevronDown, ChevronRight, ChevronUp, Lock, Eye, Pause, RotateCw,
  Flame, Bookmark, Star, Satellite, Gavel, Sparkles, Send, Microscope, Globe, Youtube,
  Database, Clock, ArrowUp, ArrowRight, ArrowLeft, FileText, Film, Images, Wand, Binoculars,
  TriangleAlert, Rocket, Dna, Key, DollarSign, Shuffle, FlaskConical, Scale, Download,
  Trophy, Users, Video, Bell, Paperclip, Pen, Trash2, GripVertical, Inbox, ExternalLink,
  Sun, LayoutGrid, SlidersHorizontal,
  FileSpreadsheet, Music, FileArchive,
  SatelliteDish, Boxes, ListTree, FilePen, CircleCheck, Loader2, Circle,
  Monitor, Building, Play, SkipBack,
  Megaphone, Heading,
  Copy, FileAudio,
  Clapperboard, Info, Link, FileUp, MessagesSquare, MessageCircle, Languages, Ruler,
  RectangleHorizontal, WandSparkles, UserRoundCog,
  LogOut, User, KeyRound,
} from "lucide-react";

export const Icon = {
  Home, Broadcast: Radio, ListCheck: ListChecks, Lightbulb, Brain, ChartLine: LineChart,
  Gear: Settings, Search, Plus, LayerGroup: Layers, Help: CircleHelp, Check, Close: X,
  ChevronDown, ChevronRight, ChevronUp, Lock, Eye, Pause, Rotate: RotateCw, Fire: Flame,
  Bookmark, Star, Satellite, Gavel, Sparkles, Send, Microscope, Globe, Youtube, Database,
  Clock, ArrowUp, ArrowRight, ArrowLeft, FileText, Film, Images, Wand, Binoculars,
  Warning: TriangleAlert, Rocket, Dna, Key, Dollar: DollarSign, Shuffle, Flask: FlaskConical,
  Scale, Download, Trophy, Users, Video, Bell, Paperclip, Pen, Trash: Trash2,
  Grip: GripVertical, Inbox, ExternalLink,
  Sun, LayoutGrid, Sliders: SlidersHorizontal,
  FileSpreadsheet, Music, FileArchive,
  SatelliteDish, Boxes, ListTree, FilePen, CircleCheck, Loader2, Circle,
  Monitor, Building, Play, SkipBack,
  Megaphone, Heading,
  Copy, FileAudio,
  Clapperboard, Info, Link, FileUp, MessagesSquare, MessageCircle, Languages, Ruler,
  RectangleHorizontal, WandSparkles, UserRoundCog,
  LogOut, User, KeyRound,
};

export type IconName = keyof typeof Icon;
