if (!require(pacman)) {
  install.packages("pacman")
  library(pacman)
}

pacman::p_load(magrittr, dplyr, tidyr, ggplot2, gdata, reshape2, forcats, parsedate)

filename <- "../../profiling/database_profiling_2018-08-02T10:48:45.993Z.csv"

queries <- read.csv(paste("./", filename, sep=""), sep = "@", stringsAsFactors = F)

# how to convert a column from string into numeric in a way that works??? and cleanly if possible.
queries$time_num <- as.integer(as.character(queries[, 2]))
queries[,2] <- NULL

colnames(queries) <- c("query", "time")

# 
grouped <- queries %>%
  group_by(query) %>%
  summarise(total=sum(time), count=n(), average=mean(time))  %>%
  arrange(desc(total))
  
total_overall <- as.numeric(sum(queries$time, na.rm = T))

grouped <- grouped %>%
  mutate(density = total / total_overall)

write.csv(x = grouped, file = paste("./", "grouped_", basename(filename)), sep = "@")