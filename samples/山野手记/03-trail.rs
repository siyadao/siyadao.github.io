//! 山野手记 · 为下一次出发，找到一条合适的小径。

#[derive(Debug, Clone)]
pub struct Trail {
    pub name: String,
    pub distance_km: f32,
    pub elevation_m: u32,
    pub scenery: Vec<String>,
}

impl Trail {
    /// 估算步行时间，为停留和观察留一点余地。
    pub fn walking_minutes(&self) -> u32 {
        let walking = self.distance_km / 4.0 * 60.0;
        let climbing = self.elevation_m as f32 / 10.0;
        (walking + climbing).ceil() as u32
    }

    /// 查找适合周末轻徒步的路线。
    pub fn is_weekend_escape(&self) -> bool {
        self.distance_km <= 8.0 && self.elevation_m <= 400
    }
}

fn main() {
    let forest_loop = Trail {
        name: "林间环线".into(),
        distance_km: 4.8,
        elevation_m: 160,
        scenery: vec!["森林".into(), "溪流".into(), "山间薄雾".into()],
    };

    println!("下一站：{}", forest_loop.name);
    println!("留给山野 {} 分钟", forest_loop.walking_minutes());
}
